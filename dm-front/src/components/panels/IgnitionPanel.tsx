import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import PanelWrapper from './PanelWrapper';
import RangeSwitcher, { type LocalRange } from './RangeSwitcher';

const RANGE_CONFIG: Record<LocalRange, { count: number; intervalMs: number }> = {
  '10m': { count: 10, intervalMs:      60_000 },
  '1h':  { count: 30, intervalMs:  2 * 60_000 },
  '6h':  { count: 72, intervalMs:  5 * 60_000 },
  '24h': { count: 48, intervalMs: 30 * 60_000 },
};

function genSeries(base: number, variance: number, count: number, intervalMs: number): [number, number][] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => [
    now - (count - 1 - i) * intervalMs,
    +(base + (Math.random() - 0.5) * variance * 2).toFixed(1),
  ]);
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function IgnitionPanel() {
  const [range, setRange] = useState<LocalRange>('1h');

  const series = useMemo(() => {
    const { count, intervalMs } = RANGE_CONFIG[range];
    return {
      procCpu: genSeries(22, 14, count, intervalMs),
      jvmMem:  genSeries(74, 10, count, intervalMs),
    };
  }, [range]);

  const option = {
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
        `<b>${fmtTime(params[0].value[0])}</b><br/>` +
        params.map(p => `${p.seriesName}: <b>${p.value[1]}%</b>`).join('<br/>'),
    },
    xAxis: {
      type: 'time',
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: (v: number) => fmtTime(v) },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed' as const, color: '#f1f5f9' } },
    },
    series: [
      { name: 'Proc. CPU', type: 'line', smooth: true, data: series.procCpu, symbol: 'none', lineStyle: { width: 2, color: '#0891b2' }, areaStyle: { color: '#0891b2', opacity: 0.06 } },
      { name: 'JVM Heap',  type: 'line', smooth: true, data: series.jvmMem,  symbol: 'none', lineStyle: { width: 2, color: '#be185d' }, areaStyle: { color: '#be185d', opacity: 0.06 } },
    ],
  };

  return (
    <PanelWrapper
      title="Ignition — Gateway SCADA"
      description="Carico CPU del processo Java (Ignition) e utilizzo heap JVM. Picchi frequenti di JVM > 85% suggeriscono tag overload, query OPC lente o memory leak."
      status="ok"
      headerExtra={<RangeSwitcher value={range} onChange={setRange} />}
    >
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </PanelWrapper>
  );
}
