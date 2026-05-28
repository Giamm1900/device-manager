import { type ReactNode, useState, useCallback, useRef, useEffect } from "react";
import { type PcStatPoint, type IgnitionPoint, type EdgeResponse, type DataSenderResponse, TelemetryContext } from "../context/TelemetryContext";
import { useTimeRange } from "../context/TimeRangeContext";
import { resolveTimeWindow } from "../hooks/useTimeWindow";
import { useMachine } from "../hooks/useMachine";

const LIVE_INTERVAL_MS = 30_000;

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

  // --- 1. COSTRUZIONE DELLA CHIAVE DI RICHIESTA ---
  // Identifica univocamente se i parametri di data fetching sono cambiati
  const currentRequestKey = selectedMachine
    ? `${selectedMachine.dbId}-${mode}-${preset}-${customFrom}-${customTo}-${refreshKey}`
    : "";
  const [lastRequestKey, setLastRequestKey] = useState("");

  if (isLive && (!selectedMachine || mode === 'custom')) {
    setIsLive(false);
  }

  if (selectedMachine && currentRequestKey !== lastRequestKey) {
    setLastRequestKey(currentRequestKey);
    setLoading(true);
    setError(false);
  }

  const hasTelemetryData =
    pcSeries.length > 0 ||
    ignSeries.length > 0 ||
    ignLatestDbStatus !== null ||
    edgeData !== null ||
    dataSenderData !== null ||
    loading ||
    error;

  if (!selectedMachine && hasTelemetryData) {
    setPcSeries([]);
    setIgnSeries([]);
    setIgnLatestDbStatus(null);
    setEdgeData(null);
    setDataSenderData(null);
    setLoading(false);
    setError(false);
    setLastRequestKey(""); 
  }

  const setLive = useCallback((on: boolean) => {
    setIsLive(on);
    if (on) setRefreshKey(k => k + 1);
  }, []);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isLive && selectedMachine) {
      intervalRef.current = setInterval(() => setRefreshKey(k => k + 1), LIVE_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, selectedMachine]);

  useEffect(() => {
    if (!selectedMachine) return;

    const { start, end } = resolveTimeWindow(mode, preset, customFrom, customTo);
    const q = `machine_id=${selectedMachine.dbId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    let cancelled = false;


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