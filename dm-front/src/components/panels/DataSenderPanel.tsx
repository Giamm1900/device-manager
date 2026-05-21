import PanelWrapper from './PanelWrapper';

const ROWS = [
  { ts: '20/05 14:23', subtype: 'SEND_OK',  file: 'data_20260520_1423.parquet', rows: 1204 },
  { ts: '20/05 14:22', subtype: 'SEND_OK',  file: 'data_20260520_1422.parquet', rows: 987  },
  { ts: '20/05 14:20', subtype: 'SEND_ERR', file: 'data_20260520_1420.parquet', rows: 0    },
  { ts: '20/05 14:19', subtype: 'SEND_OK',  file: 'data_20260520_1419.parquet', rows: 1103 },
  { ts: '20/05 14:18', subtype: 'SEND_OK',  file: 'data_20260520_1418.parquet', rows: 892  },
  { ts: '20/05 14:16', subtype: 'SEND_OK',  file: 'data_20260520_1416.parquet', rows: 1340 },
];

const totalRows = ROWS.reduce((acc, r) => acc + r.rows, 0);

const thClass = 'sticky top-0 bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-2 py-1.5 border-b border-slate-200';
const tdClass = 'px-2 py-1.5 text-[11px] text-slate-700';

export default function DataSenderPanel() {
  return (
    <PanelWrapper
      title="Data Sender — Parquet"
      description="Cronologia invii file Parquet al data lake. Ogni riga è un chunk processato; rows_count indica il numero di record inclusi nel file."
      status="ok"
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={thClass}>Timestamp</th>
              <th className={thClass}>Tipo</th>
              <th className={thClass}>File</th>
              <th className={`${thClass} text-right`}>Righe</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className={tdClass}>{r.ts}</td>
                <td className={tdClass}>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.subtype === 'SEND_ERR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {r.subtype}
                  </span>
                </td>
                <td className={`${tdClass} max-w-40 truncate`} title={r.file}>{r.file}</td>
                <td className={`${tdClass} text-right tabular-nums`}>
                  {r.rows > 0 ? r.rows.toLocaleString('it-IT') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td colSpan={3} className="px-2 py-1.5 text-[10px] text-slate-400">
                {ROWS.length} chunk nel range
              </td>
              <td className="px-2 py-1.5 text-right text-[10px] font-bold text-slate-700 tabular-nums">
                {totalRows.toLocaleString('it-IT')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PanelWrapper>
  );
}
