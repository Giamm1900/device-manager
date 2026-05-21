import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Machine } from '../data/mockTree';

interface MachineContextValue {
  selectedMachine: Machine | null;
  setSelectedMachine: (machine: Machine | null) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

const MachineContext = createContext<MachineContextValue>({
  selectedMachine: null,
  setSelectedMachine: () => {},
  selectedDate: new Date().toISOString().slice(0, 10),
  setSelectedDate: () => {},
});

export function MachineProvider({ children }: { children: ReactNode }) {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  return (
    <MachineContext.Provider value={{ selectedMachine, setSelectedMachine, selectedDate, setSelectedDate }}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine() {
  return useContext(MachineContext);
}
