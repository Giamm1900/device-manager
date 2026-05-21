import PanelWrapper from './PanelWrapper';

const MOCK_ALERTS = [
  {
    id: 1,
    severity: 'critical' as const,
    code: 'OPC_TIMEOUT',
    description: 'Timeout connessione OPC-UA driver principale',
    since: '2h 18m fa',
  },
  {
    id: 2,
    severity: 'high' as const,
    code: 'JVM_MEM_HIGH',
    description: "Utilizzo heap JVM superiore all'85%",
    since: '47m fa',
  },
  {
    id: 3,
    severity: 'medium' as const,
    code: 'DISK_WRITE_LAT',
    description: 'Latenza scrittura disco > soglia configurata',
    since: '1h 32m fa',
  },
];

const SEV_LABEL: Record<string, string> = {
  critical: 'CRITICO',
  high:     'ALTO',
  medium:   'MEDIO',
  low:      'BASSO',
};

export default function ActiveAlertsPanel() {
  return (
    <PanelWrapper
      title="Allarmi attivi"
      description="Allarmi in stato ATTIVO su questa macchina, ordinati per severità. Ogni allarme richiede presa in carico da parte dell'operatore."
      status="err"
    >
      <div className="alerts-list">
        {MOCK_ALERTS.map(a => (
          <div key={a.id} className={`alert-item ${a.severity}`}>
            <span className="alert-item__sev">{SEV_LABEL[a.severity]}</span>
            <div className="alert-item__body">
              <div className="alert-item__code">{a.code}</div>
              <div className="alert-item__since">{a.description} · {a.since}</div>
            </div>
          </div>
        ))}
        {MOCK_ALERTS.length === 0 && (
          <div className="panel__empty">
            <span className="panel__empty-icon">✓</span>
            <span className="panel__empty-text">Nessun allarme attivo</span>
          </div>
        )}
      </div>
    </PanelWrapper>
  );
}
