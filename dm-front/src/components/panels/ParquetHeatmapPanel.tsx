import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMachine } from '../../context/MachineContext';
import PanelWrapper from './PanelWrapper';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const SLOTS = Array.from({ length: 30 }, (_, i) => String(i * 2).padStart(2, '0'));

interface ApiItem {
  id: number;
  event_subtype: string;
  parquet_subfolder: string;
  parquet_filename: string;
  rows_count: number;
  processing_timestamp_utc: string;
}

interface DrawerState {
  hour: number;
  slot: number;
  status: 1 | 2;
  item: ApiItem;
}

function Row({
  label, value, mono = false, onCopy, copied,
}: {
  label: string; value: string; mono?: boolean; onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex items-start gap-1.5">
        <span className={`flex-1 text-sm text-slate-700 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copia"
            className={`shrink-0 mt-0.5 transition-colors ${copied ? 'text-green-500' : 'text-slate-300 hover:text-slate-500'}`}
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ParquetHeatmapPanel() {
  const { selectedMachine } = useMachine();

  const [viewDate, setViewDate] = useState(toLocalDateString(new Date()));

  const today = toLocalDateString(new Date());
  const isToday = viewDate === today;

  const prevDay = useCallback(() => {
    setViewDate(d => {
      const prev = new Date(d + 'T12:00:00');
      prev.setDate(prev.getDate() - 1);
      return toLocalDateString(prev);
    });
  }, []);

  const nextDay = useCallback(() => {
    if (isToday) return;
    setViewDate(d => {
      const next = new Date(d + 'T12:00:00');
      next.setDate(next.getDate() + 1);
      return toLocalDateString(next);
    });
  }, [isToday]);

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  useEffect(() => {
    if (!drawer) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setDrawer(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  useEffect(() => {
    if (!selectedMachine) {
      setApiItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFetchError(false);

    const start = encodeURIComponent(viewDate + 'T00:00:00.000Z');
    const end   = encodeURIComponent(viewDate + 'T23:59:59.999Z');

    fetch(
      `/api/v1/telemetry/data-sender?machine_id=${selectedMachine.dbId}&start=${start}&end=${end}&page=1&page_size=1000`,
    )
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ items: ApiItem[] }>;
      })
      .then(body => {
        if (cancelled) return;
        setApiItems(body.items);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFetchError(true);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [viewDate, selectedMachine, retryKey]);

  const itemMap = useMemo(() => {
    const map = new Map<string, ApiItem>();
    for (const item of apiItems) {
      const d = new Date(item.processing_timestamp_utc);
      const hour = d.getHours();
      const slot = Math.floor(d.getMinutes() / 2);
      map.set(`${hour}_${slot}`, item);
    }
    return map;
  }, [apiItems]);

  const data = useMemo((): [number, number, number][] => {
    const result: [number, number, number][] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let slot = 0; slot < 30; slot++) {
        const item = itemMap.get(`${hour}_${slot}`);
        result.push([hour, slot, item ? (item.rows_count === 0 ? 2 : 1) : 0]);
      }
    }
    return result;
  }, [itemMap]);

  const chunks = data.filter(d => d[2] === 1 || d[2] === 2).length;
  const errors = data.filter(d => d[2] === 2).length;

  const panelStatus = fetchError ? 'err' : isLoading ? 'idle' : errors > 0 ? 'warn' : 'ok';

  // Data display label: gg/mm/aaaa
  const displayDate = viewDate.split('-').reverse().join('/');

  const option = useMemo(() => ({
    animation: false,
    grid: { top: 16, right: 12, bottom: 8, left: 44 },
    xAxis: {
      type: 'category',
      data: HOURS,
      axisLabel: { fontSize: 10, color: '#64748b' },
      splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#ffffff'] } },
    },
    yAxis: {
      type: 'category',
      data: SLOTS,
      axisLabel: {
        fontSize: 9,
        color: '#64748b',
        interval: (_index: number, val: string) => parseInt(val, 10) % 20 === 0,
        formatter: (val: string) => `:${val}`,
      },
      splitArea: { show: true, areaStyle: { color: ['#f8fafc', '#ffffff'] } },
    },
    visualMap: {
      type: 'piecewise',
      pieces: [
        { value: 0, label: 'Nessun dato', color: '#e2e8f0' },
        { value: 1, label: 'OK',          color: '#16a34a' },
        { value: 2, label: 'Errore',      color: '#dc2626' },
      ],
      show: false,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: [number, number, number] }) => {
        const [hour, slot, status] = params.data;
        const mins = slot * 2;
        const time = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        if (status === 0) return `<b>${time}</b><br/>Nessun dato`;
        const item = itemMap.get(`${hour}_${slot}`);
        const statusLabel = status === 1 ? 'CHUNK_OK' : 'CHUNK_ERR';
        const rows = item ? item.rows_count : '-';
        return `<b>${time}</b><br/>${statusLabel}<br/>rows: ${rows}`;
      },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: false },
      itemStyle: { borderWidth: 1, borderColor: '#ffffff' },
      emphasis: {
        itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.25)' },
      },
    }],
  }), [data, itemMap]);

  const onEvents = useMemo(() => ({
    click: (params: unknown) => {
      const p = params as { data?: [number, number, number] };
      if (!p?.data || p.data[2] === 0) return;
      const [hour, slot, status] = p.data;
      const item = itemMap.get(`${hour}_${slot}`);
      if (!item) return;
      setDrawer({ hour, slot, status: status as 1 | 2, item });
    },
  }), [itemMap]);

  const hh = drawer ? String(drawer.hour).padStart(2, '0') : '';
  const mm = drawer ? String(drawer.slot * 2).padStart(2, '0') : '';
  const totalEndMins = drawer ? drawer.hour * 60 + drawer.slot * 2 + 2 : 0;
  const endHh = String(Math.floor(totalEndMins / 60) % 24).padStart(2, '0');
  const endMm = String(totalEndMins % 60).padStart(2, '0');
  const timeRange = drawer ? `${hh}:${mm} – ${endHh}:${endMm}` : '';

  return (
    <>
      <PanelWrapper
        title="Chunk Parquet"
        description="Heatmap dei chunk parquet scritti dal data sender. Ogni cella = intervallo di 2 minuti. Verde = CHUNK_OK, Rosso = CHUNK_ERR, Grigio = nessun dato. Usa le frecce per navigare tra i giorni."
        status={panelStatus}
        headerExtra={
          <div className="flex items-center gap-1 mr-1">
            {/* Navigazione giorno */}
            <button
              type="button"
              onClick={prevDay}
              title="Giorno precedente"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold"
            >
              ‹
            </button>
            <span className="text-xs text-slate-800 font-semibold font-mono min-w-16 text-center bg-slate-100 rounded px-2 py-0.5">{displayDate}</span>
            <button
              type="button"
              onClick={nextDay}
              disabled={isToday}
              title={isToday ? 'Giorno corrente' : 'Giorno successivo'}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <span className="text-[10px] text-slate-500 font-medium ml-1">
              {isLoading ? 'Caricamento…' : fetchError ? 'Errore fetch' : `${chunks} chunk · ${errors} errori`}
            </span>
          </div>
        }
      >
        <div className={`flex flex-col h-full transition-opacity ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {fetchError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-sm text-red-500">Impossibile caricare i dati dall'API.</span>
              <button
                type="button"
                onClick={() => setRetryKey(k => k + 1)}
                className="px-3 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Riprova
              </button>
            </div>
          ) : (
            <ReactECharts
              option={option}
              style={{ flex: 1, width: '100%', minHeight: 0 }}
              opts={{ renderer: 'canvas' }}
              onEvents={onEvents}
            />
          )}
          <div className="shrink-0 flex items-center justify-center gap-5 border-t border-slate-100 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0 bg-slate-200" />
              <span className="text-[10px] text-slate-500">Nessun dato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0 bg-green-600" />
              <span className="text-[10px] text-slate-500">OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0 bg-red-600" />
              <span className="text-[10px] text-slate-500">Errore</span>
            </div>
          </div>
        </div>
      </PanelWrapper>

      {drawer && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setDrawer(null)}
          />

          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
              <span className="text-sm font-semibold text-slate-800">Dettaglio chunk</span>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none transition-colors"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Row label="Data" value={displayDate} />
                <Row label="Ora" value={timeRange} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Stato</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${
                    drawer.status === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {drawer.status === 1 ? 'CHUNK_OK' : 'CHUNK_ERR'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <Row
                  label="File parquet"
                  value={drawer.item.parquet_filename}
                  mono
                  onCopy={() => copy('fileName', drawer.item.parquet_filename)}
                  copied={copiedField === 'fileName'}
                />
                <Row label="Rows count" value={String(drawer.item.rows_count)} />
                <Row
                  label="Subfolder"
                  value={drawer.item.parquet_subfolder}
                  mono
                  onCopy={() => copy('subfolder', drawer.item.parquet_subfolder)}
                  copied={copiedField === 'subfolder'}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
