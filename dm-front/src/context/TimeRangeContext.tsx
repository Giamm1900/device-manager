import { createContext, useContext, useState, type ReactNode } from 'react';

export type Preset = '10m' | '1h' | '6h' | '24h' | '7d' | '14d';

interface TimeRangeValue {
  mode: 'preset' | 'custom';
  preset: Preset;
  customFrom: string;
  customTo: string;
  setPreset: (p: Preset) => void;
  setCustomRange: (from: string, to: string) => void;
}

const TimeRangeContext = createContext<TimeRangeValue>({
  mode: 'preset',
  preset: '1h',
  customFrom: '',
  customTo: '',
  setPreset: () => {},
  setCustomRange: () => {},
});

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

export function useTimeRange() {
  return useContext(TimeRangeContext);
}
