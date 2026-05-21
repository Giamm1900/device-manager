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

const trendColors: Record<TrendStatus, string> = {
  ok:   'text-green-500',
  warn: 'text-amber-500',
  err:  'text-red-500',
};

function KpiCard({ label, value, sub, accentClass, badge, valueStatus, trend }: KpiCardProps) {
  const valColor = valueStatus ? valueColors[valueStatus] : 'text-slate-900';

  return (
    <div className={`bg-white border border-slate-200 border-t-2 ${accentClass} rounded-md px-3 py-2 flex flex-col gap-0.5`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {badge ? (
        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${badgeStyles[badge.type]}`}>
          {badge.text}
        </span>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={`text-[22px] font-bold leading-none ${valColor}`}>{value}</span>
          {trend && (
            <span className={`text-[13px] font-bold leading-none ${trendColors[trend.status]}`}>
              {trend.dir}
            </span>
          )}
        </div>
      )}
      {sub && <span className="text-[10px] text-slate-400 leading-tight">{sub}</span>}
    </div>
  );
}

export default function KpiBar() {
  return (
    <div className="grid grid-cols-5 gap-2 px-2 pt-2 shrink-0">
      <KpiCard
        label="CPU medio"
        value="38%"
        sub="media periodo selezionato"
        accentClass="border-t-blue-600"
        valueStatus="ok"
        trend={{ dir: '↑', status: 'warn' }}
      />
      <KpiCard
        label="RAM media"
        value="61%"
        sub="media periodo selezionato"
        accentClass="border-t-violet-600"
        valueStatus="warn"
        trend={{ dir: '→', status: 'ok' }}
      />
      <KpiCard
        label="Disco"
        value="67%"
        sub="utilizzo attuale"
        accentClass="border-t-amber-500"
        valueStatus="warn"
        trend={{ dir: '→', status: 'ok' }}
      />
      <KpiCard
        label="DB Ignition"
        sub="ultimo stato noto"
        accentClass="border-t-green-600"
        badge={{ text: '● OK', type: 'ok' }}
      />
      <KpiCard
        label="Edge uptime"
        value="94.3%"
        sub="nel range selezionato"
        accentClass="border-t-cyan-600"
        valueStatus="warn"
        trend={{ dir: '↓', status: 'warn' }}
      />
    </div>
  );
}
