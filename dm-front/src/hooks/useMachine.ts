import { useContext } from "react";
import { MachineContext } from "../context/MachineContext";

export function useMachine() {
  return useContext(MachineContext);
}