import { useState } from 'react';
import { useTimeRange, type Preset } from '../../context/TimeRangeContext';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '10m', label: '10 min' },
  { value: '1h',  label: '1 h' },
  { value: '6h',  label: '6 h' },
  { value: '24h', label: '24 h' },
  { value: '7d',  label: '7 giorni' },
  { value: '30d', label: '30 giorni' },
];

const PRESET_LABELS: Record<Preset, string> = {
  '10m': 'Ultimi 10 minuti',
  '1h':  'Ultima ora',
  '6h':  'Ultime 6 ore',
  '24h': 'Ultime 24 ore',
  '7d':  'Ultimi 7 giorni',
  '30d': 'Ultimi 30 giorni',
};

function fmtDt(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  );
}

export default function TimeRangeBar() {
  const { mode, preset, customFrom, customTo, setPreset, setCustomRange } = useTimeRange();
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo,   setDraftTo]   = useState(customTo);

  function handleApply() {
    if (draftFrom && draftTo) setCustomRange(draftFrom, draftTo);
  }

  const rangeLabel =
    mode === 'preset'
      ? PRESET_LABELS[preset]
      : `${fmtDt(customFrom)} → ${fmtDt(customTo)}`;

  return (
    <div className="flex items-center gap-3 shrink-0 bg-white border-b border-slate-200 px-4 h-10">

      {/* Preset pills */}
      <div className="flex items-center gap-1 shrink-0">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
              mode === 'preset' && preset === p.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-slate-200 shrink-0" />

      {/* Custom range inputs */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-400">Da</span>
        <input
          type="datetime-local"
          value={draftFrom}
          onChange={e => setDraftFrom(e.target.value)}
          className="text-[11px] text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-[11px] text-slate-400">A</span>
        <input
          type="datetime-local"
          value={draftTo}
          onChange={e => setDraftTo(e.target.value)}
          className="text-[11px] text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleApply}
          className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          Applica
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200 shrink-0" />

      {/* Active range indicator */}
      <span className="text-[11px] text-slate-500 truncate min-w-0">{rangeLabel}</span>
    </div>
  );
}
