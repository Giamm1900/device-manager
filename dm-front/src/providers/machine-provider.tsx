import { type ReactNode, useState } from "react";
import { MachineContext } from "../context/MachineContext";
import type { Machine } from "../data/mockTree";

export function MachineProvider({ children }: { children: ReactNode }) {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  return (
    <MachineContext.Provider value={{ selectedMachine, setSelectedMachine }}>
      {children}
    </MachineContext.Provider>
  );
}