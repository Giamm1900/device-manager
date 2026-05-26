import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useMachine } from './MachineContext';
import { useTimeRange } from './TimeRangeContext';
import { resolveTimeWindow } from '../hooks/useTimeWindow';

export interface PcStatPoint   { t: string; cpu: number | null; memory: number | null; disk: number | null; cpu_max: number | null; memory_max: number | null; disk_max: number | null; }
export interface IgnitionPoint { t: string; cpu: number | null; jvm_memory: number | null; db_status: string | null; }
export interface EdgePoint     { t: string; online: boolean; }
export interface EdgeResponse  { uptime_percent: number; series: EdgePoint[]; }
export interface DataSenderItem {
  id: number;
  event_subtype: string;
  parquet_subfolder: string | null;
  parquet_filename: string | null;
  rows_count: number | null;
  processing_timestamp_utc: string | null;
  status: 'SEND_OK' | 'SEND_ERR';
}
export interface DataSenderResponse { items: DataSenderItem[]; page: number; page_size: number; total: number; total_rows: number; }

const LIVE_INTERVAL_MS = 30_000;

interface TelemetryValue {
  pcSeries:           PcStatPoint[];
  ignSeries:          IgnitionPoint[];
  ignLatestDbStatus:  string | null;
  edgeData:           EdgeResponse | null;
  dataSenderData:     DataSenderResponse | null;
  loading:            boolean;
  error:              boolean;
  isLive:             boolean;
  setLive:            (on: boolean) => void;
  refresh:            () => void;
}

const TelemetryContext = createContext<TelemetryValue>({
  pcSeries: [], ignSeries: [], ignLatestDbStatus: null, edgeData: null, dataSenderData: null,
  loading: false, error: false,
  isLive: false, setLive: () => {}, refresh: () => {},
});

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { selectedMachine } = useMachine();
  const { mode, preset, customFrom, customTo } = useTimeRange();

  const [pcSeries,          setPcSeries]          = useState<PcStatPoint[]>([]);
  const [ignSeries,         setIgnSeries]         = useState<IgnitionPoint[]>([]);
  const [ignLatestDbStatus, setIgnLatestDbStatus] = useState<string | null>(null);
  const [edgeData,          setEdgeData]          = useState<EdgeResponse | null>(null);
  const [dataSenderData,    setDataSenderData]    = useState<DataSenderResponse | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const setLive = useCallback((on: boolean) => {
    setIsLive(on);
    // reset al preset più recente quando si attiva il LIVE
    if (on) setRefreshKey(k => k + 1);
  }, []);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Polling interval quando LIVE è attivo
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isLive && selectedMachine) {
      intervalRef.current = setInterval(() => setRefreshKey(k => k + 1), LIVE_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, selectedMachine]);

  // Disattiva LIVE se si cambia macchina o si passa a custom range
  useEffect(() => {
    if (!selectedMachine || mode === 'custom') setIsLive(false);
  }, [selectedMachine, mode]);

  useEffect(() => {
    if (!selectedMachine) {
      setPcSeries([]); setIgnSeries([]); setIgnLatestDbStatus(null); setEdgeData(null); setDataSenderData(null);
      setLoading(false); setError(false);
      return;
    }

    const { start, end } = resolveTimeWindow(mode, preset, customFrom, customTo);
    const q = `machine_id=${selectedMachine.dbId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([
      fetch(`/api/v1/telemetry/pc-stats?${q}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/v1/telemetry/ignition-stats?${q}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/v1/telemetry/edge-status?${q}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/v1/telemetry/data-sender?${q}&page=1&page_size=100`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([pc, ign, edge, ds]: [{ series: PcStatPoint[] }, { series: IgnitionPoint[]; latest_db_status: string | null }, EdgeResponse, DataSenderResponse]) => {
        if (cancelled) return;
        setPcSeries(pc?.series  ?? []);
        setIgnSeries(ign?.series ?? []);
        setIgnLatestDbStatus(ign?.latest_db_status ?? null);
        setEdgeData(edge ?? null);
        setDataSenderData(ds ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
        // ferma il LIVE se arriva un errore
        setIsLive(false);
      });

    return () => { cancelled = true; };
  }, [selectedMachine, mode, preset, customFrom, customTo, refreshKey]);

  return (
    <TelemetryContext.Provider value={{ pcSeries, ignSeries, ignLatestDbStatus, edgeData, dataSenderData, loading, error, isLive, setLive, refresh }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  return useContext(TelemetryContext);
}
