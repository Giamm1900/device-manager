import { useApiTree }   from '../../hooks/useApiTree';
import type { MachineStatus, Machine } from '../../data/mockTree';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useMachine } from '../../hooks/useMachine';
import { useTimeRange } from '../../hooks/useTimeRange';

function dotClass(status: MachineStatus): string {
  if (status === 'online')  return 'bg-green-500';
  if (status === 'offline') return 'bg-red-500';
  return 'bg-slate-400';
}

export default function MachineBar() {
  const { selectedMachine, setSelectedMachine } = useMachine();
  const { tree, loading } = useApiTree();
  const { isLive, setLive, refresh } = useTelemetry();
  const { mode } = useTimeRange();

  function findById(id: string): Machine | null {
    for (const c of tree)
      for (const p of c.plants) {
        const m = p.machines.find(m => m.id === id);
        if (m) return m;
      }
    return null;
  }

  function getBreadcrumb(id: string): string {
    for (const c of tree)
      for (const p of c.plants)
        if (p.machines.some(m => m.id === id))
          return `${c.name} › ${p.name}`;
    return '';
  }

  const breadcrumb = selectedMachine ? getBreadcrumb(selectedMachine.id) : '';
  const liveDisabled = !selectedMachine || mode === 'custom';

  return (
    <div className="bg-white border-b border-slate-200 px-4 shrink-0 flex items-center gap-4 h-14">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Macchina</span>
        {selectedMachine && (
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass(selectedMachine.status)}`} />
        )}
        <div className="flex flex-col min-w-0">
          <select
            value={selectedMachine?.id ?? ''}
            onChange={e => setSelectedMachine(findById(e.target.value))}
            disabled={loading}
            title="Seleziona macchina"
            className="border-2 border-slate-300 rounded-md px-2.5 py-1 text-sm font-medium text-slate-800 bg-white appearance-none cursor-pointer outline-none focus:border-blue-500 max-w-64 disabled:text-slate-400 disabled:border-slate-200"
          >
            <option value="">
              {loading ? 'Caricamento…' : '— seleziona macchina —'}
            </option>
            {tree.map(client =>
              client.plants.map(plant => (
                <optgroup key={plant.id} label={`${client.name} › ${plant.name}`}>
                  {plant.machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
          {breadcrumb && (
            <span className="text-[11px] text-slate-400 leading-none mt-0.5 truncate max-w-64">
              {breadcrumb}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 shrink-0">
        {/* Refresh manuale */}
        <button
          type="button"
          onClick={refresh}
          disabled={!selectedMachine}
          title="Aggiorna dati ora"
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M4 10a6 6 0 1 0 1.17-3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="1 4 4 7 7 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* LIVE toggle */}
        <button
          type="button"
          onClick={() => setLive(!isLive)}
          disabled={liveDisabled}
          title={
            liveDisabled
              ? (mode === 'custom' ? 'LIVE non disponibile in modalità custom' : 'Seleziona una macchina')
              : isLive ? 'Disattiva aggiornamento automatico' : 'Attiva aggiornamento ogni 30s'
          }
          className={`flex items-center gap-1.5 border rounded px-2.5 py-1 text-xs transition-colors ${
            isLive
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          LIVE
        </button>
      </div>
    </div>
  );
}
