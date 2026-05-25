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
  const [showCustom, setShowCustom] = useState(mode === 'custom');
  const [rangeError, setRangeError] = useState('');

  function handlePreset(p: Preset) {
    setPreset(p);
    setShowCustom(false);
    setRangeError('');
  }

  function handleCustomToggle() {
    setShowCustom(v => !v);
    setRangeError('');
  }

  function handleApply() {
    if (!draftFrom || !draftTo) {
      setRangeError('Inserisci entrambe le date.');
      return;
    }
    if (draftFrom >= draftTo) {
      setRangeError('"Da" deve essere precedente a "A".');
      return;
    }
    setRangeError('');
    setCustomRange(draftFrom, draftTo);
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
            onClick={() => handlePreset(p.value)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
              mode === 'preset' && preset === p.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Custom toggle pill */}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-blue-600 text-white'
              : showCustom
              ? 'bg-slate-200 text-slate-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom range inputs — visibili solo quando showCustom è attivo */}
      {showCustom && (
        <>
          <div className="w-px h-5 bg-slate-200 shrink-0" />

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400">Da</span>
            <input
              type="datetime-local"
              value={draftFrom}
              onChange={e => { setDraftFrom(e.target.value); setRangeError(''); }}
              className="text-[11px] text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400">A</span>
            <input
              type="datetime-local"
              value={draftTo}
              onChange={e => { setDraftTo(e.target.value); setRangeError(''); }}
              className="text-[11px] text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleApply}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Applica
            </button>
            {rangeError && (
              <span className="text-[10px] text-red-500">{rangeError}</span>
            )}
          </div>
        </>
      )}

      <div className="w-px h-5 bg-slate-200 shrink-0" />

      {/* Active range indicator */}
      <span className="text-[11px] text-slate-500 truncate min-w-0">{rangeLabel}</span>
    </div>
  );
}
