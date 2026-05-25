import { useMachine } from '../../context/MachineContext';
import { useApiTree }  from '../../hooks/useApiTree';
import type { MachineStatus, Machine } from '../../data/mockTree';

function dotClass(status: MachineStatus): string {
  if (status === 'online')  return 'bg-green-500';
  if (status === 'offline') return 'bg-red-500';
  return 'bg-slate-400';
}

export default function MachineBar() {
  const { selectedMachine, setSelectedMachine } = useMachine();
  const { tree, loading } = useApiTree();

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

  return (
    <div className="bg-white border-b border-slate-200 px-4 shrink-0 flex items-center gap-3 h-11">
      <div className="flex items-center gap-2 min-w-0">
        {selectedMachine && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass(selectedMachine.status)}`} />
        )}
        <div className="flex flex-col min-w-0">
          <select
            value={selectedMachine?.id ?? ''}
            onChange={e => setSelectedMachine(findById(e.target.value))}
            disabled={loading}
            title="Seleziona macchina"
            className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 bg-white appearance-none cursor-pointer outline-none focus:border-blue-400 max-w-50 disabled:text-slate-400"
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
            <span className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-50">
              {breadcrumb}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          94.3% uptime
        </div>
      </div>
    </div>
  );
}
