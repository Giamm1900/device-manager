import { useMachine } from '../../context/MachineContext';
import { MOCK_TREE, type MachineStatus, type Machine } from '../../data/mockTree';

function dotClass(status: MachineStatus): string {
  if (status === 'online')  return 'bg-green-500';
  if (status === 'offline') return 'bg-red-500';
  return 'bg-slate-400';
}

function findMachineById(id: string): Machine | null {
  for (const client of MOCK_TREE) {
    for (const plant of client.plants) {
      const m = plant.machines.find(m => m.id === id);
      if (m) return m;
    }
  }
  return null;
}

function getBreadcrumb(machineId: string): string {
  for (const client of MOCK_TREE) {
    for (const plant of client.plants) {
      if (plant.machines.some(m => m.id === machineId)) {
        return `${client.name} › ${plant.name}`;
      }
    }
  }
  return '';
}

export default function MachineBar() {
  const { selectedMachine, setSelectedMachine, selectedDate, setSelectedDate } = useMachine();

  const breadcrumb = selectedMachine ? getBreadcrumb(selectedMachine.id) : '';

  return (
    <div className="bg-white border-b border-slate-200 px-4 shrink-0 flex items-center gap-3 h-11">
      {/* Dot + select + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {selectedMachine && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass(selectedMachine.status)}`} />
        )}
        <div className="flex flex-col min-w-0">
          <select
            value={selectedMachine?.id ?? ''}
            onChange={e => setSelectedMachine(findMachineById(e.target.value))}
            className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 bg-white appearance-none cursor-pointer outline-none focus:border-blue-400 max-w-[200px]"
          >
            <option value="">— seleziona macchina —</option>
            {MOCK_TREE.map(client =>
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
            <span className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[200px]">
              {breadcrumb}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Data + separatore + uptime */}
      <div className="flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          Data:
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 outline-none focus:border-blue-400"
          />
        </label>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          94.3% uptime
        </div>
      </div>
    </div>
  );
}
