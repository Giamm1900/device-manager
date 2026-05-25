import { useState, useEffect, useMemo } from 'react';
import { useMachine }   from '../../context/MachineContext';
import { useTimeRange, type Preset } from '../../context/TimeRangeContext';
import { resolveTimeWindow } from '../../hooks/useTimeWindow';

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

interface PcStatPoint   { cpu: number | null; memory: number | null; disk: number | null; }
interface IgnitionPoint { db_status: string | null; }
interface EdgeResponse  { uptime_percent: number; }

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
  '30d': 'ultimi 30 giorni',
};

export default function KpiBar() {
  const { selectedMachine } = useMachine();
  const { mode, preset, customFrom, customTo } = useTimeRange();

  const [pcSeries,   setPcSeries]   = useState<PcStatPoint[]>([]);
  const [ignSeries,  setIgnSeries]  = useState<IgnitionPoint[]>([]);
  const [edgeData,   setEdgeData]   = useState<EdgeResponse | null>(null);

  useEffect(() => {
    if (!selectedMachine) {
      setPcSeries([]); setIgnSeries([]); setEdgeData(null);
      return;
    }
    const { start, end } = resolveTimeWindow(mode, preset, customFrom, customTo);
    const q = `machine_id=${selectedMachine.dbId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    let cancelled = false;

    Promise.all([
      fetch(`/api/v1/telemetry/pc-stats?${q}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/v1/telemetry/ignition-stats?${q}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/v1/telemetry/edge-status?${q}`).then(r => r.ok ? r.json() : null),
    ]).then(([pc, ign, edge]) => {
      if (cancelled) return;
      setPcSeries(pc?.series  ?? []);
      setIgnSeries(ign?.series ?? []);
      setEdgeData(edge ?? null);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [selectedMachine, mode, preset, customFrom, customTo]);

  const cpu    = useMemo(() => avg(pcSeries.map(p => p.cpu)),    [pcSeries]);
  const ram    = useMemo(() => avg(pcSeries.map(p => p.memory)), [pcSeries]);
  const disk   = useMemo(() => avg(pcSeries.map(p => p.disk)),   [pcSeries]);
  const uptime = edgeData?.uptime_percent ?? null;
  const lastDb = ignSeries.length ? ignSeries[ignSeries.length - 1].db_status : null;

  const dbBadge = !selectedMachine
    ? { text: '● N/D',  type: 'warn' as const }
    : lastDb === 'connected'
    ? { text: '● OK',   type: 'ok'   as const }
    : lastDb
    ? { text: '● WARN', type: 'warn' as const }
    : { text: '● N/D',  type: 'warn' as const };

  const rangeSub = mode === 'preset' ? RANGE_SUB[preset] : 'range personalizzato';
  const fmt      = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <div className="grid grid-cols-5 gap-2 px-2 pt-2 shrink-0">
      <KpiCard
        label="CPU medio"
        value={fmt(cpu)}
        sub={rangeSub}
        accentClass="border-t-blue-600"
        valueStatus={statusOf(cpu, 50, 75)}
      />
      <KpiCard
        label="RAM media"
        value={fmt(ram)}
        sub={rangeSub}
        accentClass="border-t-violet-600"
        valueStatus={statusOf(ram, 65, 80)}
      />
      <KpiCard
        label="Disco"
        value={fmt(disk)}
        sub="media nel range"
        accentClass="border-t-amber-500"
        valueStatus={statusOf(disk, 70, 85)}
      />
      <KpiCard
        label="DB Ignition"
        sub="ultimo stato noto"
        accentClass="border-t-green-600"
        badge={dbBadge}
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
