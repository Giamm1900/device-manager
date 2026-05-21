import PanelWrapper from './PanelWrapper';

const DAYS = ['20 Mag', '19 Mag', '18 Mag', '17 Mag', '16 Mag', '15 Mag', '14 Mag'];

const MOCK_DATA: Record<string, [number, number, number, number]> = {
  '20 Mag': [1, 2, 1, 0],
  '19 Mag': [3, 4, 1, 0],
  '18 Mag': [0, 1, 3, 1],
  '17 Mag': [2, 0, 0, 0],
  '16 Mag': [4, 3, 2, 0],
  '15 Mag': [1, 1, 1, 1],
  '14 Mag': [2, 2, 0, 0],
};

function cellClass(val: number, col: number): string {
  if (val === 0) return '';
  const classes = ['c1', 'c2', 'c3', 'c4'];
  return classes[col] ?? '';
}

export default function AlertHistoryPanel() {
  return (
    <PanelWrapper
      title="Storico allarmi"
      description="Distribuzione allarmi risolti per severità e giorno. Identifica pattern ricorrenti e fasce temporali critiche."
      status="ok"
    >
      <div className="ah-grid">
        <div className="ah-header">
          <span />
          <span>LOW</span>
          <span>MED</span>
          <span>HIGH</span>
          <span>CRIT</span>
        </div>
        {DAYS.map(day => {
          const [low, med, high, crit] = MOCK_DATA[day];
          return (
            <div key={day} className="ah-row">
              <span className="ah-row__date">{day}</span>
              <div className={`ah-cell ${cellClass(low,  0)}`}>{low  > 0 ? low  : ''}</div>
              <div className={`ah-cell ${cellClass(med,  1)}`}>{med  > 0 ? med  : ''}</div>
              <div className={`ah-cell ${cellClass(high, 2)}`}>{high > 0 ? high : ''}</div>
              <div className={`ah-cell ${cellClass(crit, 3)}`}>{crit > 0 ? crit : ''}</div>
            </div>
          );
        })}
      </div>
    </PanelWrapper>
  );
}
