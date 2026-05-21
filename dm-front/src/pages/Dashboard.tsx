import { MachineProvider }      from '../context/MachineContext';
import Sidebar                  from '../components/layout/Sidebar';
import MachineBar               from '../components/layout/MachineBar';
import KpiBar                   from '../components/panels/KpiBar';
import PcStatsPanel             from '../components/panels/PcStatsPanel';
import IgnitionPanel            from '../components/panels/IgnitionPanel';
import ParquetHeatmapPanel      from '../components/panels/ParquetHeatmapPanel';
import EdgeStatusPanel          from '../components/panels/EdgeStatusPanel';

export default function Dashboard() {
  return (
    <MachineProvider>
      <div className="h-screen overflow-hidden flex bg-slate-100">

        <Sidebar />

        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          <MachineBar />
          <KpiBar />

          <div className="grid grid-cols-[55fr_45fr] gap-2 flex-1 min-h-0 p-2 overflow-hidden">
            <ParquetHeatmapPanel />
            <div className="grid grid-rows-[1fr_1fr_9rem] gap-2 min-h-0">
              <PcStatsPanel />
              <IgnitionPanel />
              <EdgeStatusPanel />
            </div>
          </div>
        </div>

      </div>
    </MachineProvider>
  );
}
