export type MachineStatus = 'online' | 'offline' | 'unknown';

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
}

export interface Plant {
  id: string;
  name: string;
  machines: Machine[];
}

export interface Client {
  id: string;
  name: string;
  plants: Plant[];
}

export const MOCK_TREE: Client[] = [
  {
    id: 'c1',
    name: 'Acme Industries',
    plants: [
      {
        id: 'p1',
        name: 'Stabilimento Nord',
        machines: [
          { id: 'm1', name: 'CNC-01',   status: 'online'  },
          { id: 'm2', name: 'CNC-02',   status: 'offline' },
          { id: 'm3', name: 'Press-01', status: 'online'  },
        ],
      },
      {
        id: 'p2',
        name: 'Stabilimento Sud',
        machines: [
          { id: 'm4', name: 'Robot-01', status: 'online'  },
          { id: 'm5', name: 'Robot-02', status: 'unknown' },
        ],
      },
    ],
  },
  {
    id: 'c2',
    name: 'Beta Automation',
    plants: [
      {
        id: 'p3',
        name: 'Linea A',
        machines: [
          { id: 'm6', name: 'Conveyor-01', status: 'online'  },
          { id: 'm7', name: 'Conveyor-02', status: 'offline' },
        ],
      },
      {
        id: 'p4',
        name: 'Linea B',
        machines: [
          { id: 'm8', name: 'Welder-01', status: 'online' },
          { id: 'm9', name: 'Welder-02', status: 'online' },
        ],
      },
    ],
  },
];
