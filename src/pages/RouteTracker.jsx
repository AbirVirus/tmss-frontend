import { useState, useEffect } from 'react';
import { routeApi } from '../services/api';
import { offlineSave } from '../store/db';

const SUPERVISOR_ID = 'supervisor-01';
const today = new Date().toISOString().split('T')[0];

export default function RouteTracker() {
  const [method, setMethod] = useState('manual_odometer');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [todayRoute, setTodayRoute] = useState(null);

  // Manual odometer state
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');

  // OSRM route state
  const [startLocation, setStartLocation] = useState({ name: '', lat: '', lng: '' });
  const [endLocation, setEndLocation] = useState({ name: '', lat: '', lng: '' });
  const [waypoints, setWaypoints] = useState([]);

  // Common
  const [fuelRate, setFuelRate] = useState('15');

  useEffect(() => {
    loadTodayRoute();
  }, []);

  async function loadTodayRoute() {
    try {
      const { data } = await routeApi.getByDate(today, SUPERVISOR_ID);
      if (data) {
        setTodayRoute(data);
        setMethod(data.calculationMethod || 'manual_odometer');
        if (data.startOdometer != null) setStartOdo(String(data.startOdometer));
        if (data.endOdometer != null) setEndOdo(String(data.endOdometer));
        if (data.fuelCostPerKm) setFuelRate(String(data.fuelCostPerKm));
        if (data.startLocation?.name) setStartLocation(prev => ({ ...prev, name: data.startLocation.name, lat: data.startLocation.lat || '', lng: data.startLocation.lng || '' }));
        if (data.endLocation?.name) setEndLocation(prev => ({ ...prev, name: data.endLocation.name, lat: data.endLocation.lat || '', lng: data.endLocation.lng || '' }));
        if (data.waypoints?.length) setWaypoints(data.waypoints.map(w => ({ name: w.name || '', lat: w.lat || '', lng: w.lng || '' })));
      }
    } catch (e) { /* offline */ }
  }

  function addWaypoint() {
    setWaypoints([...waypoints, { name: '', lat: '', lng: '' }]);
  }

  function removeWaypoint(idx) {
    setWaypoints(waypoints.filter((_, i) => i !== idx));
  }

  function updateWaypoint(idx, field, value) {
    const updated = [...waypoints];
    updated[idx] = { ...updated[idx], [field]: value };
    setWaypoints(updated);
  }

  async function handleOsmrPreview() {
    setError('');
    if (!startLocation.lat || !startLocation.lng || !endLocation.lat || !endLocation.lng) {
      setError('Start and End coordinates are required for OSRM preview');
      return;
    }
    setCalculating(true);
    try {
      const { data } = await routeApi.preview({
        startLocation: { name: startLocation.name || 'Start', lat: +startLocation.lat, lng: +startLocation.lng },
        waypoints: waypoints.filter(w => w.lat && w.lng).map((w, i) => ({ name: w.name || `Stop ${i + 1}`, lat: +w.lat, lng: +w.lng })),
        endLocation: { name: endLocation.name || 'End', lat: +endLocation.lat, lng: +endLocation.lng }
      });
      setPreview(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setCalculating(false);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    setSaved(false);

    const payload = {
      date: today,
      supervisorId: SUPERVISOR_ID,
      calculationMethod: method,
      fuelCostPerKm: +fuelRate || 15,
      travelMode: 'motorcycle'
    };

    if (method === 'manual_odometer') {
      if (!startOdo || !endOdo) {
        setError('Please enter both start and end odometer readings');
        setSaving(false);
        return;
      }
      payload.startOdometer = +startOdo;
      payload.endOdometer = +endOdo;
    } else {
      if (!startLocation.lat || !startLocation.lng || !endLocation.lat || !endLocation.lng) {
        setError('Coordinates required for start and end locations');
        setSaving(false);
        return;
      }
      payload.startLocation = { name: startLocation.name || 'Start', lat: +startLocation.lat, lng: +startLocation.lng };
      payload.endLocation = { name: endLocation.name || 'End', lat: +endLocation.lat, lng: +endLocation.lng };
      payload.waypoints = waypoints.filter(w => w.lat && w.lng).map((w, i) => ({ name: w.name || `Somiti ${i + 1}`, lat: +w.lat, lng: +w.lng, order: i }));
      payload.legs = preview?.legs || [];
      payload.totalDistanceKm = preview?.totalDistanceKm || 0;
    }

    try {
      const { data } = await routeApi.calculate(payload);
      setTodayRoute(data);
      setSaved(true);
    } catch (e) {
      // Offline fallback
      await offlineSave('dailyRoutes', { ...payload, _id: today + '-' + SUPERVISOR_ID });
      setSaved(true);
    }
    setSaving(false);
  }

  const computedDistance = method === 'manual_odometer' && startOdo && endOdo
    ? (+endOdo - +startOdo).toFixed(2)
    : preview?.totalDistanceKm;
  const computedFuelCost = computedDistance ? Math.round(computedDistance * (+fuelRate || 15)) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary-800">Route & Mileage Tracker</h2>

      {/* Saved route summary */}
      {todayRoute && (
        <div className="card bg-primary-50 border-primary-200">
          <p className="text-sm font-semibold text-primary-700">Today's Recorded Route</p>
          <p className="text-2xl font-bold text-primary-800">{todayRoute.totalDistanceKm} km</p>
          <p className="text-sm text-primary-600">
            Method: {todayRoute.calculationMethod === 'manual_odometer' ? 'Manual Odometer' : 'OSRM'} &middot; Fuel: ৳{todayRoute.totalFuelCost}
          </p>
        </div>
      )}

      {/* Method tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {['manual_odometer', 'osrm'].map(m => (
          <button
            key={m}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              method === m ? 'bg-white shadow text-primary-700' : 'text-gray-500'
            }`}
            onClick={() => setMethod(m)}
          >
            {m === 'manual_odometer' ? 'Odometer' : 'OSRM Route'}
          </button>
        ))}
      </div>

      {/* Option A: Manual Odometer */}
      {method === 'manual_odometer' && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700">Motorcycle Odometer Reading</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Start Meter Reading (km)</label>
            <input type="number" className="input-field" placeholder="e.g. 45230"
              value={startOdo} onChange={e => setStartOdo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">End Meter Reading (km)</label>
            <input type="number" className="input-field" placeholder="e.g. 45285"
              value={endOdo} onChange={e => setEndOdo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Fuel Cost Per KM (৳)</label>
            <input type="number" className="input-field" placeholder="15"
              value={fuelRate} onChange={e => setFuelRate(e.target.value)} />
          </div>
          {computedDistance != null && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-1">
              <p className="text-sm text-green-700">Traveled: <strong>{computedDistance} km</strong></p>
              <p className="text-sm text-green-700">Fuel Cost: <strong>৳{computedFuelCost}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Option B: OSRM Route */}
      {method === 'osrm' && (
        <div className="space-y-3">
          {/* Start */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm">Start Location</h3>
            <input className="input-field" placeholder="Name (e.g. TMSS Branch Office)"
              value={startLocation.name} onChange={e => setStartLocation({ ...startLocation, name: e.target.value })} />
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Latitude"
                value={startLocation.lat} onChange={e => setStartLocation({ ...startLocation, lat: e.target.value })} />
              <input className="input-field flex-1" placeholder="Longitude"
                value={startLocation.lng} onChange={e => setStartLocation({ ...startLocation, lng: e.target.value })} />
            </div>
          </div>

          {/* Waypoints */}
          {waypoints.map((wp, idx) => (
            <div key={idx} className="card space-y-2 border-l-4 border-l-primary-400">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 text-sm">Stop {idx + 1} (Somiti)</h3>
                <button onClick={() => removeWaypoint(idx)}
                  className="text-red-500 text-xs font-semibold px-2 py-1 rounded-lg bg-red-50">Remove</button>
              </div>
              <input className="input-field" placeholder="Name (e.g. Somiti A)"
                value={wp.name} onChange={e => updateWaypoint(idx, 'name', e.target.value)} />
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="Lat"
                  value={wp.lat} onChange={e => updateWaypoint(idx, 'lat', e.target.value)} />
                <input className="input-field flex-1" placeholder="Lng"
                  value={wp.lng} onChange={e => updateWaypoint(idx, 'lng', e.target.value)} />
              </div>
            </div>
          ))}

          <button onClick={addWaypoint} className="btn-outline text-sm py-2.5">
            + Add Somiti Stop (Waypoint)
          </button>

          {/* End */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm">End Location</h3>
            <input className="input-field" placeholder="Name (e.g. Home / Office)"
              value={endLocation.name} onChange={e => setEndLocation({ ...endLocation, name: e.target.value })} />
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Latitude"
                value={endLocation.lat} onChange={e => setEndLocation({ ...endLocation, lat: e.target.value })} />
              <input className="input-field flex-1" placeholder="Longitude"
                value={endLocation.lng} onChange={e => setEndLocation({ ...endLocation, lng: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Fuel Cost Per KM (৳)</label>
            <input type="number" className="input-field" placeholder="15"
              value={fuelRate} onChange={e => setFuelRate(e.target.value)} />
          </div>

          <button onClick={handleOsmrPreview} disabled={calculating}
            className="btn-outline text-sm py-2.5">
            {calculating ? 'Calculating Route...' : 'Preview Route (OSRM)'}
          </button>

          {preview && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-2">
              <p className="text-sm text-blue-700">
                Total Distance: <strong>{preview.totalDistanceKm} km</strong>
                {preview._fallback === 'haversine' && <span className="text-yellow-600 ml-1">(straight-line estimate)</span>}
              </p>
              <p className="text-sm text-blue-700">Est. Time: <strong>{preview.totalDurationMin} min</strong></p>
              <p className="text-sm text-blue-700">Fuel Cost: <strong>৳{Math.round(preview.totalDistanceKm * (+fuelRate || 15))}</strong></p>
              {preview.legs?.length > 0 && (
                <details className="text-xs text-blue-600 mt-1">
                  <summary className="cursor-pointer font-medium">Leg Details</summary>
                  {preview.legs.map((leg, i) => (
                    <div key={i} className="mt-1 pl-2 border-l border-blue-300">
                      {leg.from} → {leg.to}: {leg.distanceKm} km
                    </div>
                  ))}
                </details>
              )}
            </div>
          )}

          {preview?.geometry && (
            <div className="bg-white rounded-xl p-2 border">
              <canvas ref={c => { if (c && preview?.geometry) drawMiniMap(c, preview.geometry, startLocation, endLocation, waypoints); }}
                className="w-full h-40 rounded-lg" />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Route Data'}
      </button>
    </div>
  );
}

function drawMiniMap(canvas, geometry, start, end, waypoints) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;

  // Find bounds
  const coords = geometry.coordinates;
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  const pad = 0.1;
  const lngRange = (maxLng - minLng) || 0.01;
  const latRange = (maxLat - minLat) || 0.01;
  minLng -= lngRange * pad;
  maxLng += lngRange * pad;
  minLat -= latRange * pad;
  maxLat += latRange * pad;

  function project(lng, lat) {
    const x = ((lng - minLng) / (maxLng - minLng)) * w;
    const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
    return [x, y];
  }

  // Draw route line
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  coords.forEach(([lng, lat], i) => {
    const [x, y] = project(lng, lat);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw markers
  function drawMarker(lng, lat, color, label) {
    const [x, y] = project(lng, lat);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 4);
  }

  if (start.lat) drawMarker(+start.lng, +start.lat, '#16a34a', 'S');
  waypoints.filter(w => w.lat).forEach((w, i) => drawMarker(+w.lng, +w.lat, '#2563eb', String(i + 1)));
  if (end.lat) drawMarker(+end.lng, +end.lat, '#dc2626', 'E');
}
