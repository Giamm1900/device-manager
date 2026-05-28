import { useMachine } from '../../hooks/useMachine';
import { useTelemetry } from '../../hooks/useTelemetry';
import PanelWrapper from './PanelWrapper';

const thClass = 'sticky top-0 bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-2 py-1.5 border-b border-slate-200';
const tdClass = 'px-2 py-1.5 text-[11px] text-slate-700';

function fmtTs(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function DataSenderPanel() {
  const { selectedMachine } = useMachine();
  const { dataSenderData, loading, error, refresh } = useTelemetry();

  const items = dataSenderData?.items ?? [];
  const total = dataSenderData?.total ?? 0;
  const totalRows = dataSenderData?.total_rows ?? 0;

  return (
    <PanelWrapper
      title="Data Sender — Parquet"
      description="Cronologia invii file Parquet al data lake. Ogni riga è un chunk processato; rows_count indica il numero di record inclusi nel file."
      status={error ? 'err' : loading ? 'idle' : 'ok'}
    >
      {!selectedMachine ? (
        <div className="flex items-center justify-center h-full text-[11px] text-slate-400">
          Seleziona una macchina
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-[11px] text-slate-500">
          <span>Errore nel caricamento dei dati.</span>
          <button onClick={refresh} className="text-blue-500 underline">Riprova</button>
        </div>
      ) : (
        <div className="overflow-y-auto h-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thClass}>Timestamp</th>
                <th className={thClass}>Stato</th>
                <th className={thClass}>File</th>
                <th className={`${thClass} text-right`}>Righe</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className={tdClass}>{fmtTs(item.processing_timestamp_utc)}</td>
                  <td className={tdClass}>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.status === 'SEND_ERR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={`${tdClass} max-w-40 truncate`} title={item.parquet_filename ?? undefined}>
                    {item.parquet_filename ?? '—'}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`}>
                    {(item.rows_count ?? 0) > 0 ? (item.rows_count!).toLocaleString('it-IT') : '—'}
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-[11px] text-slate-400">
                    Nessun invio nel range selezionato
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="px-2 py-1.5 text-[10px] text-slate-400">
                  {total} chunk nel range
                </td>
                <td className="px-2 py-1.5 text-right text-[10px] font-bold text-slate-700 tabular-nums">
                  {totalRows.toLocaleString('it-IT')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </PanelWrapper>
  );
}
