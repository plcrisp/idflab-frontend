export interface AnnualRainfallData {
  year: number;
  value: number | null;
  isPeak?: boolean;
}

export interface FutureRainfallBar {
  index: number;
  value: number;
  opacity: number;
}

export interface MethodologyDifferentiator {
  id: number;
  title: string;
  description: string;
  icon: string;
  isFuture?: boolean;
}

export interface StationPeakInfo {
  year: number;
  value: number;
  valueFormatted: string;
  date: string;
  city: string;
  stationName: string;
  inmetCode: string;
  completeYears: number;
}
