import { AnnualRainfallData, FutureRainfallBar } from '../models/auth-presentation.models';

export function createDeterministicPrng(seed: number = 83781) {
  let state = seed;
  return function (): number {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function generateHistoricalSeries(
  startYear: number,
  endYear: number,
  incompleteYears: number[],
  peakYear: number,
  peakValue: number,
): AnnualRainfallData[] {
  const prng = createDeterministicPrng(83781);
  const incompleteSet = new Set(incompleteYears);
  const result: AnnualRainfallData[] = [];

  for (let year = startYear; year <= endYear; year++) {
    if (incompleteSet.has(year)) {
      result.push({ year, value: null });
      continue;
    }

    if (year === peakYear) {
      result.push({ year, value: peakValue, isPeak: true });
      continue;
    }

    const cycle = Math.sin((year - startYear) * 0.45) * 14;
    const noise = (prng() - 0.5) * 44;
    const base = 88 + cycle + noise;
    const clamped = Math.max(55, Math.min(120, parseFloat(base.toFixed(1))));

    result.push({ year, value: clamped, isPeak: false });
  }

  return result;
}

export function generateFutureBars(count: number = 24): FutureRainfallBar[] {
  const prng = createDeterministicPrng(2100);
  const bars: FutureRainfallBar[] = [];

  for (let i = 0; i < count; i++) {
    const decay = 1 - (i / (count - 1)) * 0.82;
    const opacity = parseFloat(Math.max(0.12, decay).toFixed(2));
    const variation = (prng() - 0.45) * 55;
    const value = Math.max(60, Math.min(122, parseFloat((88 + variation).toFixed(1))));

    bars.push({ index: i, value, opacity });
  }

  return bars;
}
