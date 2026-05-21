import PanelWrapper from './PanelWrapper';

const SEGMENTS = [
  1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,
];

const onlineCount = SEGMENTS.filter(s => s === 1).length;
const uptimePct   = ((onlineCount / SEGMENTS.length) * 100).toFixed(1);

export default function EdgeStatusPanel() {
  return (
    <PanelWrapper
      title="Edge Client — Connettività"
      description="Stato di connettività dell'edge client verso il cloud. Ogni barra = un campionamento (blu online, rosso offline). % uptime calcolata sull'intero range selezionato."
      status="ok"
    >
      <div className="h-full flex flex-col gap-2 px-3 py-2">

        {/* Uptime summary */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 leading-none">{uptimePct}%</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Uptime nel range</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500">{onlineCount} / {SEGMENTS.length} campioni online</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ultimo aggiornamento: adesso</div>
          </div>
        </div>

        {/* Strip */}
        <div className="flex gap-0.5 flex-1 items-stretch min-h-0">
          {SEGMENTS.map((s, i) => (
            <div
              key={i}
              title={s ? 'Online' : 'Offline'}
              className={`flex-1 rounded-sm ${s ? 'bg-blue-600' : 'bg-red-300'}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            Online
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-red-300" />
            Offline
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
