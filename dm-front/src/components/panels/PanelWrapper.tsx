import { useState, type ReactNode } from 'react';

type StatusDot = 'ok' | 'warn' | 'err' | 'idle';

interface PanelWrapperProps {
  title: string;
  description: string;
  status?: StatusDot;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
}

export default function PanelWrapper({
  title,
  description,
  status = 'idle',
  children,
  className = '',
  headerExtra,
}: PanelWrapperProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  const dotColor =
    status === 'ok'   ? 'bg-green-500' :
    status === 'warn' ? 'bg-amber-400' :
    status === 'err'  ? 'bg-red-500'   :
    'bg-slate-300';

  return (
    // overflow-hidden rimosso dal card esterno: serve al popover "i" per uscire dal bordo
    <div className={`bg-white border border-slate-200 rounded-md flex flex-col min-h-0 ${className}`}>
      <div className="shrink-0 px-3 py-1.5 border-b border-slate-100 flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide leading-none flex-1 truncate">
          {title}
        </span>

        {/* Info button + popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setInfoOpen(v => !v)}
            className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 text-[9px] font-bold flex items-center justify-center transition-colors"
          >
            i
          </button>

          {infoOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setInfoOpen(false)} />
              <div className="absolute top-full left-0 z-50 mt-1 bg-slate-800 text-slate-100 text-[11px] rounded-md px-3 py-2 w-72 shadow-lg leading-relaxed">
                {description}
              </div>
            </>
          )}
        </div>

        {headerExtra}

        <span
          className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
          title={
            status === 'ok'   ? 'Dati aggiornati' :
            status === 'warn' ? 'Attenzione' :
            status === 'err'  ? 'Errore fetch' :
            'In attesa di selezione'
          }
        />
      </div>

      {/* overflow-hidden rimane qui: contiene il canvas ECharts */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        {children}
      </div>
    </div>
  );
}
