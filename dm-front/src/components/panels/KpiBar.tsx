import { useMemo } from 'react';
import { useTimeRange, type Preset } from '../../context/TimeRangeContext';
import { useTelemetry } from '../../hooks/useTelemetry';

type TrendStatus = 'ok' | 'warn' | 'err';

interface KpiCardProps {
  label: string;
  value?: string;
  sub?: string;
  accentClass: string;
  badge?: { text: string; type: 'ok' | 'warn' | 'error' };
  valueStatus?: TrendStatus;
  trend?: { dir: '↑' | '↓' | '→'; status: TrendStatus };
}

const badgeStyles = {
  ok:    'bg-green-100 text-green-700',
  warn:  'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const valueColors: Record<TrendStatus, string> = {
  ok:   'text-green-600',
  warn: 'text-amber-600',
  err:  'text-red-600',
};

function KpiCard({ label, value, sub, accentClass, badge, valueStatus, trend }: KpiCardProps) {
  const valColor = valueStatus ? valueColors[valueStatus] : 'text-slate-900';
  return (
    <div className={`bg-white border border-slate-200 border-t-2 ${accentClass} rounded-md px-3 py-2 flex flex-col gap-0.5`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      {badge ? (
        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${badgeStyles[badge.type]}`}>
          {badge.text}
        </span>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={`text-[22px] font-bold leading-none ${valColor}`}>{value ?? '—'}</span>
          {trend && (
            <span className={`text-[13px] font-bold leading-none ${trend.status === 'ok' ? 'text-green-500' : trend.status === 'warn' ? 'text-amber-500' : 'text-red-500'}`}>
              {trend.dir}
            </span>
          )}
        </div>
      )}
      {sub && <span className="text-[10px] text-slate-400 leading-tight">{sub}</span>}
    </div>
  );
}

function avg(arr: (number | null)[]): number | null {
  const vals = arr.filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function statusOf(val: number | null, warnAt: number, errAt: number, reversed = false): TrendStatus {
  if (val === null) return 'ok';
  if (reversed) return val <= errAt ? 'err' : val <= warnAt ? 'warn' : 'ok';
  return val >= errAt ? 'err' : val >= warnAt ? 'warn' : 'ok';
}

const RANGE_SUB: Record<Preset, string> = {
  '10m': 'ultimi 10 min',
  '1h':  'ultima ora',
  '6h':  'ultime 6 ore',
  '24h': 'ultime 24 ore',
  '7d':  'ultimi 7 giorni',
  '14d': 'ultimi 14 giorni',
};

export default function KpiBar() {
  const { mode, preset } = useTimeRange();
  const { pcSeries, edgeData } = useTelemetry();

  const cpu    = useMemo(() => avg(pcSeries.map(p => p.cpu)),  [pcSeries]);
  const disk   = useMemo(() => avg(pcSeries.map(p => p.disk)), [pcSeries]);
  const uptime = edgeData?.uptime_percent ?? null;

  const rangeSub = mode === 'preset' ? RANGE_SUB[preset] : 'range personalizzato';
  const fmt      = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="grid grid-cols-3 gap-2 shrink-0">
      <KpiCard
        label="CPU medio"
        value={fmt(cpu)}
        sub={rangeSub}
        accentClass="border-t-blue-600"
        valueStatus={statusOf(cpu, 50, 75)}
      />
      <KpiCard
        label="Disco"
        value={fmt(disk)}
        sub="media nel range"
        accentClass="border-t-amber-500"
        valueStatus={statusOf(disk, 70, 85)}
      />
      <KpiCard
        label="Edge uptime"
        value={fmt(uptime)}
        sub={rangeSub}
        accentClass="border-t-cyan-600"
        valueStatus={statusOf(uptime, 94, 88, true)}
      />
    </div>
  );
}
