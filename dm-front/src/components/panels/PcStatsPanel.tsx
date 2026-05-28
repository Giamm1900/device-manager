import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import PanelWrapper from './PanelWrapper';
import { useMachine }   from '../../context/MachineContext';
import { useTimeRange } from '../../context/TimeRangeContext';
import { resolveTimeWindow } from '../../hooks/useTimeWindow';
import { useTelemetry } from '../../hooks/useTelemetry';

function fmtTs(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs >= 7 * 24 * 60 * 60_000) return `${d.getDate()}/${d.getMonth() + 1}`;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PcStatsPanel() {
  const { selectedMachine } = useMachine();
  const { mode, preset, customFrom, customTo } = useTimeRange();
  const { pcSeries: series, loading, error, refresh } = useTelemetry();

  const rangeMs = useMemo(
    () => resolveTimeWindow(mode, preset, customFrom, customTo).rangeMs,
    [mode, preset, customFrom, customTo],
  );

  const is1d = rangeMs > 7 * 24 * 60 * 60_000;

  const option = useMemo(() => {
    const maxSeries = is1d ? [
      {
        name: 'CPU max', type: 'line' as const, smooth: true, symbol: 'none', legendHoverLink: false,
        data: series.map(p => [new Date(p.t).getTime(), +(p.cpu_max ?? 0).toFixed(1)]),
        lineStyle: { width: 1, color: '#2563eb', type: 'dashed' as const }, showInLegend: false,
        tooltip: { show: false },
      },
      {
        name: 'RAM max', type: 'line' as const, smooth: true, symbol: 'none', legendHoverLink: false,
        data: series.map(p => [new Date(p.t).getTime(), +(p.memory_max ?? 0).toFixed(1)]),
        lineStyle: { width: 1, color: '#7c3aed', type: 'dashed' as const }, showInLegend: false,
        tooltip: { show: false },
      },
      {
        name: 'Disco max', type: 'line' as const, smooth: true, symbol: 'none', legendHoverLink: false,
        data: series.map(p => [new Date(p.t).getTime(), +(p.disk_max ?? 0).toFixed(1)]),
        lineStyle: { width: 1, color: '#d97706', type: 'dashed' as const }, showInLegend: false,
        tooltip: { show: false },
      },
    ] : [];

    return {
      animation: false,
      grid: { top: 28, right: 12, bottom: 28, left: 38 },
      legend: {
        data: ['CPU', 'RAM', 'Disco'],
        right: 0, top: 2,
        itemWidth: 10, itemHeight: 10,
        textStyle: { fontSize: 10, color: '#64748b' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
        formatter: (params: { seriesName: string; value: [number, number] }[]) => {
          const visible = params.filter(p => !p.seriesName.endsWith(' max'));
          return `<b>${fmtTs(visible[0].value[0], rangeMs)}</b><br/>` +
            visible.map(p => {
              const maxP = params.find(m => m.seriesName === p.seriesName + ' max');
              const maxStr = maxP ? ` / max <b>${maxP.value[1].toFixed(1)}%</b>` : '';
              return `${p.seriesName}: avg <b>${p.value[1].toFixed(1)}%</b>${maxStr}`;
            }).join('<br/>');
        },
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
          name: 'CPU', type: 'line', smooth: true, symbol: 'none',
          data: series.map(p => [new Date(p.t).getTime(), +(p.cpu ?? 0).toFixed(1)]),
          lineStyle: { width: 2, color: '#2563eb' }, areaStyle: { color: '#2563eb', opacity: 0.06 },
          markLine: { silent: true, symbol: 'none', data: [{ yAxis: 80 }], lineStyle: { type: 'dashed' as const, color: '#ef4444', width: 1 }, label: { formatter: '80%', fontSize: 9, color: '#ef4444', position: 'end' } },
        },
        {
          name: 'RAM', type: 'line', smooth: true, symbol: 'none',
          data: series.map(p => [new Date(p.t).getTime(), +(p.memory ?? 0).toFixed(1)]),
          lineStyle: { width: 2, color: '#7c3aed' }, areaStyle: { color: '#7c3aed', opacity: 0.06 },
        },
        {
          name: 'Disco', type: 'line', smooth: true, symbol: 'none',
          data: series.map(p => [new Date(p.t).getTime(), +(p.disk ?? 0).toFixed(1)]),
          lineStyle: { width: 2, color: '#d97706' }, areaStyle: { color: '#d97706', opacity: 0.06 },
        },
        ...maxSeries,
      ],
    };
  }, [series, rangeMs, is1d]);

  return (
    <PanelWrapper
      title="PC Stats — Hardware"
      description="Utilizzo hardware del PC industriale (CPU, RAM, Disco) nel periodo selezionato. Valori sostenuti > 80% indicano rischio di saturazione o rallentamenti operativi."
      status={error ? 'err' : loading ? 'idle' : 'ok'}
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
