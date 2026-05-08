import { useState, useEffect, useCallback } from 'react';
import { locationApi } from '../services/api';

const labels = ['Division', 'District', 'Upazila', 'Union/Ward', 'Village', 'Para'];

export default function CascadingLocationSelect({ value = {}, onChange }) {
  const [levels, setLevels] = useState([[], [], [], [], [], []]);
  const [selected, setSelected] = useState([
    value.division || '', value.district || '', value.upazila || '',
    value.union || '', value.village || '', value.para || ''
  ]);
  const [loading, setLoading] = useState([false, false, false, false, false, false]);

  useEffect(() => {
    loadLevel(0, selected);
  }, []);

  async function loadLevel(idx, currentSelected) {
    if (idx === 0) {
      setLoading(prev => { const n = [...prev]; n[0] = true; return n; });
      try {
        const { data } = await locationApi.getDivisions();
        setLevels(prev => { const n = [...prev]; n[0] = data; return n; });
      } catch (e) { /* offline */ }
      setLoading(prev => { const n = [...prev]; n[0] = false; return n; });
      return;
    }

    setLoading(prev => { const n = [...prev]; n[idx] = true; return n; });

    const sel = currentSelected || selected;
    const fns = [
      null, locationApi.getDistricts, locationApi.getUpazilas,
      locationApi.getUnions, locationApi.getVillages, locationApi.getParas
    ];

    try {
      let data;
      switch (idx) {
        case 1: ({ data } = await fns[1](sel[0])); break;
        case 2: ({ data } = await fns[2](sel[0], sel[1])); break;
        case 3: ({ data } = await fns[3](sel[0], sel[1], sel[2])); break;
        case 4: ({ data } = await fns[4](sel[0], sel[1], sel[2], sel[3])); break;
        case 5: ({ data } = await fns[5](sel[0], sel[1], sel[2], sel[3], sel[4])); break;
      }
      setLevels(prev => { const n = [...prev]; n[idx] = data; return n; });

      // Clear deeper levels
      for (let i = idx + 1; i < 6; i++) {
        setLevels(prev => { const n = [...prev]; n[i] = []; return n; });
      }
    } catch (e) { /* offline */ }

    setLoading(prev => { const n = [...prev]; n[idx] = false; return n; });
  }

  function handleSelect(idx, val) {
    const newSel = [...selected];
    newSel[idx] = val;
    for (let i = idx + 1; i < 6; i++) newSel[i] = '';
    setSelected(newSel);

    const location = {
      division: newSel[0], district: newSel[1], upazila: newSel[2],
      union: newSel[3], village: newSel[4], para: newSel[5]
    };
    onChange(location);

    if (idx < 5) loadLevel(idx + 1, newSel);
  }

  return (
    <div className="space-y-3">
      {labels.map((label, idx) => {
        const shouldShow = idx === 0 || (idx > 0 && selected[idx - 1]);
        if (!shouldShow) return null;

        return (
          <div key={idx}>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">{label}</label>
            <select
              className="cascading-select"
              value={selected[idx]}
              onChange={e => handleSelect(idx, e.target.value)}
              disabled={loading[idx] || (idx > 0 && !selected[idx - 1])}
            >
              <option value="">-- Select {label} --</option>
              {levels[idx].map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {loading[idx] && (
              <div className="flex items-center gap-1 mt-1 ml-1">
                <div className="w-3 h-3 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Loading...</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
