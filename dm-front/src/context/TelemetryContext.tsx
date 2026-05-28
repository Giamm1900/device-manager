import { createContext } from "react";
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

export const TelemetryContext = createContext<TelemetryValue>({
  pcSeries: [], ignSeries: [], ignLatestDbStatus: null, edgeData: null, dataSenderData: null,
  loading: false, error: false,
  isLive: false, setLive: () => {}, refresh: () => {},
});



