import { useState } from 'react';
import { type Preset } from '../../context/TimeRangeContext';
import { useTimeRange } from '../../hooks/useTimeRange';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '10m', label: '10 min' },
  { value: '1h',  label: '1 h' },
  { value: '6h',  label: '6 h' },
  { value: '24h', label: '24 h' },
  { value: '7d',  label: '7 giorni' },
  { value: '14d', label: '14 giorni' },
];

const PRESET_LABELS: Record<Preset, string> = {
  '10m': 'Ultimi 10 minuti',
  '1h':  'Ultima ora',
  '6h':  'Ultime 6 ore',
  '24h': 'Ultime 24 ore',
  '7d':  'Ultimi 7 giorni',
  '14d': 'Ultimi 14 giorni',
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
    <div className="shrink-0 bg-white border border-slate-200 rounded-md px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Periodo</span>

        {/* Preset pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                mode === 'preset' && preset === p.value
                  ? 'bg-blue-600 text-white shadow-sm'
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
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-blue-600 text-white shadow-sm'
                : showCustom
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="w-px h-4 bg-slate-200 shrink-0" />
        <span className="text-xs text-slate-500 font-medium truncate min-w-0">{rangeLabel}</span>
      </div>

      {/* Custom range inputs — visibili solo quando showCustom è attivo */}
      {showCustom && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <label htmlFor="time-range-from" className="text-xs text-slate-500 font-medium">Da</label>
          <input
            id="time-range-from"
            type="datetime-local"
            value={draftFrom}
            onChange={e => { setDraftFrom(e.target.value); setRangeError(''); }}
            className="text-xs text-slate-700 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="time-range-to" className="text-xs text-slate-500 font-medium">A</label>
          <input
            id="time-range-to"
            type="datetime-local"
            value={draftTo}
            onChange={e => { setDraftTo(e.target.value); setRangeError(''); }}
            className="text-xs text-slate-700 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApply}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Applica
          </button>
          {rangeError && (
            <span className="text-[11px] text-red-500">{rangeError}</span>
          )}
        </div>
      )}
    </div>
  );
}
