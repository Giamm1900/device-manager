import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Machine } from '../data/mockTree';

interface MachineContextValue {
  selectedMachine: Machine | null;
  setSelectedMachine: (machine: Machine | null) => void;
}

const MachineContext = createContext<MachineContextValue>({
  selectedMachine: null,
  setSelectedMachine: () => {},
});

export function MachineProvider({ children }: { children: ReactNode }) {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  return (
    <MachineContext.Provider value={{ selectedMachine, setSelectedMachine }}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine() {
  return useContext(MachineContext);
}
