import { useContext } from "react";
import { TelemetryContext } from "../context/TelemetryContext";

export function useTelemetry() {
  return useContext(TelemetryContext);
}