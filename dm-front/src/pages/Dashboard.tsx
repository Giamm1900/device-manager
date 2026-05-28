import Sidebar                  from '../components/layout/Sidebar';
import MachineBar               from '../components/layout/MachineBar';
import TimeRangeBar             from '../components/layout/TimeRangeBar';
import KpiBar                   from '../components/panels/KpiBar';
import PcStatsPanel             from '../components/panels/PcStatsPanel';
import IgnitionPanel            from '../components/panels/IgnitionPanel';
import ParquetHeatmapPanel      from '../components/panels/ParquetHeatmapPanel';
import EdgeStatusPanel          from '../components/panels/EdgeStatusPanel';
import { TelemetryProvider } from '../providers/telemetry-provider';
import { useMachine } from '../hooks/useMachine';
import { MachineProvider } from '../providers/machine-provider';
import { TimeRangeProvider } from '../providers/time-range-provider';

function PanelArea() {
  const { selectedMachine } = useMachine();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden relative">
      <MachineBar />

      <div className="flex items-start gap-2 shrink-0 px-2 pt-2">
        <div className="flex-1 min-w-0">
          <KpiBar />
        </div>
        <TimeRangeBar />
      </div>

      <div className="grid grid-cols-[55fr_45fr] gap-3 flex-1 min-h-0 p-2 overflow-hidden">
        <ParquetHeatmapPanel />
        <div className="grid grid-rows-[1fr_1fr_9rem] gap-3 min-h-0">
          <PcStatsPanel />
          <IgnitionPanel />
          <EdgeStatusPanel />
        </div>
      </div>

      {/* Global empty state — sovrapposto all'area pannelli */}
      {!selectedMachine && (
        <div className="absolute inset-0 top-14 flex flex-col items-center justify-center gap-3 bg-slate-100/90 backdrop-blur-[2px] z-10">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="w-14 h-14">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Nessuna macchina selezionata</p>
            <p className="text-xs text-slate-400 mt-0.5">Seleziona una macchina dal menu in alto per visualizzare i dati</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <TimeRangeProvider>
      <MachineProvider>
        <TelemetryProvider>
          <div className="h-screen overflow-hidden flex bg-slate-100">
            <Sidebar />
            <PanelArea />
          </div>
        </TelemetryProvider>
      </MachineProvider>
    </TimeRangeProvider>
  );
}
