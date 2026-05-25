import type { Preset } from '../context/TimeRangeContext';

const PRESET_MS: Record<Preset, number> = {
  '10m':    10 *           60_000,
  '1h':          60 *      60_000,
  '6h':      6 * 60 *      60_000,
  '24h':    24 * 60 *      60_000,
  '7d':  7 * 24 * 60 *     60_000,
  '30d': 30 * 24 * 60 *    60_000,
};

export function resolveTimeWindow(
  mode: 'preset' | 'custom',
  preset: Preset,
  customFrom: string,
  customTo: string,
): { start: string; end: string; rangeMs: number } {
  if (mode === 'custom') {
    const start = new Date(customFrom).toISOString();
    const end   = new Date(customTo).toISOString();
    return { start, end, rangeMs: new Date(end).getTime() - new Date(start).getTime() };
  }
  const now   = new Date();
  const start = new Date(now.getTime() - PRESET_MS[preset]);
  return { start: start.toISOString(), end: now.toISOString(), rangeMs: PRESET_MS[preset] };
}
