import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMachine } from '../../context/MachineContext';
import PanelWrapper from './PanelWrapper';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const SLOTS = Array.from({ length: 30 }, (_, i) => String(i * 2).padStart(2, '0'));

function genHeatmapData(dateStr: string): [number, number, number][] {
  let seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  function rand(): number {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return seed / 4294967295;
  }

  const result: [number, number, number][] = [];
  for (let hour = 0; hour < 24; hour++) {
    const prob = hour >= 6 && hour <= 22 ? 0.85 : 0.05;
    for (let slot = 0; slot < 30; slot++) {
      const r = rand();
      const status: 0 | 1 | 2 = r < prob ? (rand() < 0.95 ? 1 : 2) : 0;
      result.push([hour, slot, status]);
    }
  }
  return result;
}

export default function ParquetHeatmapPanel() {
  const { selectedDate } = useMachine();

  const data = useMemo(() => genHeatmapData(selectedDate), [selectedDate]);

  const sends = data.filter(d => d[2] !== 0).length;
  const errors = data.filter(d => d[2] === 2).length;

  const option = useMemo(() => ({
    animation: false,
    grid: { top: 8, right: 140, bottom: 52, left: 40 },
    xAxis: {
      type: 'category',
      data: HOURS,
      axisLabel: { fontSize: 10, color: '#64748b' },
      splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#ffffff'] } },
    },
    yAxis: {
      type: 'category',
      data: SLOTS,
      axisLabel: {
        fontSize: 9,
        color: '#64748b',
        formatter: (val: string) => parseInt(val, 10) % 10 === 0 ? val : '',
      },
      splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#ffffff'] } },
    },
    visualMap: {
      type: 'piecewise',
      pieces: [
        { value: 0, label: 'Nessun dato', color: '#e2e8f0' },
        { value: 1, label: 'OK',          color: '#16a34a' },
        { value: 2, label: 'Errore',      color: '#dc2626' },
      ],
      show: true,
      orient: 'horizontal',
      bottom: 4,
      left: 'center',
      textStyle: { fontSize: 10, color: '#64748b' },
      itemWidth: 14,
      itemHeight: 10,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: [number, number, number] }) => {
        const [hour, slot, status] = params.data;
        const mins = slot * 2;
        const time = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        const statusLabel = status === 0 ? 'Nessun dato' : status === 1 ? 'SEND_OK' : 'SEND_ERR';
        const rows = status !== 0 ? ((hour * 30 + slot) * 37 % 800 + 100) : '-';
        return `<b>${time}</b><br/>${statusLabel}<br/>rows: ${rows}`;
      },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.25)' },
      },
    }],
  }), [data]);

  return (
    <PanelWrapper
      title="Invii Parquet"
      description="Heatmap degli invii dati verso il cloud. Ogni cella = intervallo di 2 minuti. Verde = SEND_OK, Rosso = SEND_ERR, Grigio = nessun dato. La data è selezionabile nella barra superiore."
      status={errors > 0 ? 'warn' : 'ok'}
      headerExtra={
        <span className="text-[10px] text-slate-500 font-medium mr-1">
          {sends} invii · {errors} errori
        </span>
      }
    >
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </PanelWrapper>
  );
}
