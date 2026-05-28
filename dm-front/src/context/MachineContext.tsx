import { createContext } from 'react';
import type { Machine } from '../data/mockTree';

export interface MachineContextValue {
  selectedMachine: Machine | null;
  setSelectedMachine: (machine: Machine | null) => void;
}

export const MachineContext = createContext<MachineContextValue>({
  selectedMachine: null,
  setSelectedMachine: () => {},
});

