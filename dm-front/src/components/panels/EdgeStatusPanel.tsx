import { useMemo } from 'react';
import { useMachine }   from '../../context/MachineContext';
import { useTimeRange } from '../../context/TimeRangeContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { resolveTimeWindow } from '../../hooks/useTimeWindow';
import PanelWrapper from './PanelWrapper';

function fmtTs(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs >= 7 * 24 * 60 * 60_000) return `${d.getDate()}/${d.getMonth() + 1}`;
  if (rangeMs >= 24 * 60 * 60_000)
    return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}h`;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDuration(minutes: number): string {
  if (minutes < 1)  return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${(minutes / 60).toFixed(1)}h`;
}

export default function EdgeStatusPanel() {
  const { selectedMachine } = useMachine();
  const { mode, preset, customFrom, customTo } = useTimeRange();
  const { edgeData: apiData, loading, error, refresh } = useTelemetry();

  const { startMs, rangeMs } = useMemo(() => {
    const { start, rangeMs } = resolveTimeWindow(mode, preset, customFrom, customTo);
    return { startMs: new Date(start).getTime(), rangeMs };
  }, [mode, preset, customFrom, customTo]);

  const uptimePct   = apiData?.uptime_percent.toFixed(1) ?? '—';
  const uptimeNum   = apiData?.uptime_percent ?? 100;
  const uptimeColor = uptimeNum < 88 ? 'text-red-600' : uptimeNum < 94 ? 'text-amber-600' : 'text-green-600';
  const panelStatus = error ? 'err' : loading ? 'idle' : !apiData ? 'idle' : uptimeNum < 88 ? 'err' : uptimeNum < 94 ? 'warn' : 'ok';

  const segments = useMemo((): { online: boolean; ts: number }[] => {
    if (!apiData || !apiData.series.length) return [];
    const raw = apiData.series;
    if (raw.length <= 90) return raw.map(p => ({ online: p.online, ts: new Date(p.t).getTime() }));
    const step = Math.ceil(raw.length / 90);
    return raw
      .filter((_, i) => i % step === 0)
      .map(p => ({ online: p.online, ts: new Date(p.t).getTime() }));
  }, [apiData]);

  let maxOfflineSeg = 0, cur = 0;
  for (const s of segments) { if (!s.online) { cur++; maxOfflineSeg = Math.max(maxOfflineSeg, cur); } else cur = 0; }
  const segMs        = segments.length > 0 ? rangeMs / segments.length : 0;
  const maxOutageMin = Math.round(maxOfflineSeg * segMs / 60_000);
  const onlineCount  = segments.filter(s => s.online).length;

  const startLabel = fmtTs(startMs,           rangeMs);
  const endLabel   = fmtTs(startMs + rangeMs, rangeMs);

  return (
    <PanelWrapper
      title="Edge Client — Connettività"
      description="Stato di connettività dell'edge client verso il cloud. Ogni barra = un campionamento (blu online, rosso offline). % uptime calcolata sull'intero range selezionato."
      status={panelStatus}
    >
      {!selectedMachine ? (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">
          Seleziona una macchina
        </div>
      ) : error ? (
        <div className="h-full flex flex-col items-center justify-center gap-2">
          <span className="text-sm text-red-500">Errore nel caricamento dei dati.</span>
          <button
            type="button"
            onClick={refresh}
            className="px-3 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Riprova
          </button>
        </div>
      ) : (
        <div className="h-full flex flex-col gap-1.5 px-3 py-2">
          <div className="flex items-end justify-between shrink-0">
            <div>
              <div className={`text-3xl font-bold leading-none ${uptimeColor}`}>{uptimePct}%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Uptime nel range</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500">{onlineCount} / {segments.length} campioni online</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {maxOfflineSeg > 0 ? `Outage max: ${fmtDuration(maxOutageMin)}` : 'Nessun outage'}
              </div>
            </div>
          </div>

          <div className="flex gap-px flex-1 items-stretch min-h-0">
            {segments.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Nessun dato nel periodo
              </div>
            ) : (
              segments.map((s, i) => (
                <div
                  key={i}
                  title={`${fmtTs(s.ts, rangeMs)} — ${s.online ? 'Online' : 'Offline'}`}
                  className={`flex-1 rounded-sm ${s.online ? 'bg-blue-500' : 'bg-red-400'}`}
                />
              ))
            )}
          </div>

          <div className="shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <span>{startLabel}</span>
              <span className="text-slate-200">—</span>
              <span>{endLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" /> Online
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-400 shrink-0" /> Offline
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
