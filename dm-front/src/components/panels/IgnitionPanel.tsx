import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import PanelWrapper from './PanelWrapper';
import { useMachine }   from '../../context/MachineContext';
import { useTimeRange } from '../../context/TimeRangeContext';
import { resolveTimeWindow } from '../../hooks/useTimeWindow';

interface IgnitionStatPoint { t: string; cpu: number | null; jvm_memory: number | null; db_status: string | null; }

function fmtTs(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs >= 7 * 24 * 60 * 60_000) return `${d.getDate()}/${d.getMonth() + 1}`;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function IgnitionPanel() {
  const { selectedMachine } = useMachine();
  const { mode, preset, customFrom, customTo } = useTimeRange();
  const [series, setData]    = useState<IgnitionStatPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState(false);

  useEffect(() => {
    if (!selectedMachine) { setData([]); return; }
    const { start, end } = resolveTimeWindow(mode, preset, customFrom, customTo);
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(
      `/api/v1/telemetry/ignition-stats?machine_id=${selectedMachine.dbId}` +
      `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    )
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<{ series: IgnitionStatPoint[] }>; })
      .then(body => { if (!cancelled) { setData(body.series); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedMachine, mode, preset, customFrom, customTo]);

  const rangeMs = useMemo(
    () => resolveTimeWindow(mode, preset, customFrom, customTo).rangeMs,
    [mode, preset, customFrom, customTo],
  );

  const option = useMemo(() => ({
    animation: false,
    grid: { top: 28, right: 12, bottom: 28, left: 38 },
    legend: {
      data: ['Proc. CPU', 'JVM Heap'],
      right: 0, top: 2,
      itemWidth: 10, itemHeight: 10,
      textStyle: { fontSize: 10, color: '#64748b' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
      formatter: (params: { seriesName: string; value: [number, number] }[]) =>
        `<b>${fmtTs(params[0].value[0], rangeMs)}</b><br/>` +
        params.map(p => `${p.seriesName}: <b>${p.value[1].toFixed(1)}%</b>`).join('<br/>'),
    },
    xAxis: {
      type: 'time',
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: (v: number) => fmtTs(v, rangeMs) },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed' as const, color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'Proc. CPU', type: 'line', smooth: true, symbol: 'none',
        data: series.map(p => [new Date(p.t).getTime(), +(p.cpu ?? 0).toFixed(1)]),
        lineStyle: { width: 2, color: '#0891b2' }, areaStyle: { color: '#0891b2', opacity: 0.06 },
      },
      {
        name: 'JVM Heap', type: 'line', smooth: true, symbol: 'none',
        data: series.map(p => [new Date(p.t).getTime(), +(p.jvm_memory ?? 0).toFixed(1)]),
        lineStyle: { width: 2, color: '#be185d' }, areaStyle: { color: '#be185d', opacity: 0.06 },
        markLine: { silent: true, symbol: 'none', data: [{ yAxis: 80 }], lineStyle: { type: 'dashed' as const, color: '#ef4444', width: 1 }, label: { formatter: '80%', fontSize: 9, color: '#ef4444', position: 'end' } },
      },
    ],
  }), [series, rangeMs]);

  return (
    <PanelWrapper
      title="Ignition — Gateway SCADA"
      description="Carico CPU del processo Java (Ignition) e utilizzo heap JVM. Picchi frequenti di JVM > 85% suggeriscono tag overload, query OPC lente o memory leak."
      status={error ? 'err' : loading ? 'idle' : 'ok'}
    >
      {!selectedMachine ? (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">
          Seleziona una macchina
        </div>
      ) : error ? (
        <div className="h-full flex items-center justify-center text-sm text-red-500">
          Errore nel caricamento dei dati.
        </div>
      ) : (
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          showLoading={loading}
        />
      )}
    </PanelWrapper>
  );
}
