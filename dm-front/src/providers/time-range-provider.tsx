import { useState, type ReactNode } from "react";
import { TimeRangeContext, type Preset } from "../context/TimeRangeContext";

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [preset, setPresetState] = useState<Preset>('1h');
  const [customFrom, setCustomFrom] = useState(
    () => new Date(Date.now() - 24 * 60 * 60_000).toISOString().slice(0, 16)
  );
  const [customTo, setCustomTo] = useState(
    () => new Date().toISOString().slice(0, 16)
  );

  function setPreset(p: Preset) {
    setPresetState(p);
    setMode('preset');
  }

  function setCustomRange(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setMode('custom');
  }

  return (
    <TimeRangeContext.Provider value={{ mode, preset, customFrom, customTo, setPreset, setCustomRange }}>
      {children}
    </TimeRangeContext.Provider>
  );
}
