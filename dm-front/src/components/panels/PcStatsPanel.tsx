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

export default function PcStatsPanel() {
  const [range, setRange] = useState<LocalRange>('1h');

  const series = useMemo(() => {
    const { count, intervalMs } = RANGE_CONFIG[range];
    return {
      cpu:  genSeries(38, 18, count, intervalMs),
      mem:  genSeries(61,  8, count, intervalMs),
      disk: genSeries(67,  2, count, intervalMs),
    };
  }, [range]);

  const option = {
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
      { name: 'CPU',   type: 'line', smooth: true, data: series.cpu,  symbol: 'none', lineStyle: { width: 2, color: '#2563eb' }, areaStyle: { color: '#2563eb', opacity: 0.06 } },
      { name: 'RAM',   type: 'line', smooth: true, data: series.mem,  symbol: 'none', lineStyle: { width: 2, color: '#7c3aed' }, areaStyle: { color: '#7c3aed', opacity: 0.06 } },
      { name: 'Disco', type: 'line', smooth: true, data: series.disk, symbol: 'none', lineStyle: { width: 2, color: '#d97706' }, areaStyle: { color: '#d97706', opacity: 0.06 } },
    ],
  };

  return (
    <PanelWrapper
      title="PC Stats — Hardware"
      description="Utilizzo hardware del PC industriale (CPU, RAM, Disco) nel periodo selezionato. Valori sostenuti > 80% indicano rischio di saturazione o rallentamenti operativi."
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
