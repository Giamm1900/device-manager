import { createContext } from 'react';

export type Preset = '10m' | '1h' | '6h' | '24h' | '7d' | '14d';

export interface TimeRangeValue {
  mode: 'preset' | 'custom';
  preset: Preset;
  customFrom: string;
  customTo: string;
  setPreset: (p: Preset) => void;
  setCustomRange: (from: string, to: string) => void;
}

export const TimeRangeContext = createContext<TimeRangeValue>({
  mode: 'preset',
  preset: '1h',
  customFrom: '',
  customTo: '',
  setPreset: () => {},
  setCustomRange: () => {},
});

