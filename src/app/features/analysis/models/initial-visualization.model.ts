export type CoverageStatus = 'complete' | 'partial' | 'failure';
export type AggregationLevel = 'month' | 'day' | 'hour';

export interface YearlySummaryItem {
  year: number;
  max_value: number | null;
  max_value_date: string | null;
  failure_percentage: number;
  coverage_status: CoverageStatus;
}

export interface GlobalStats {
  total_records: number;
  failure_percentage: number;
  valid_years: number;
  total_years: number;
  max_value: number | null;
  max_value_date: string | null;
}

export interface DetailPoint {
  date: string;
  value: number | null;
  is_failure: boolean;
  is_annual_max: boolean;
}

export interface FailureWindow {
  start: string;
  end: string;
}

export interface SummaryResponse {
  stats: GlobalStats;
  yearly_summary: YearlySummaryItem[];
  default_window: [string, string];
}

export interface DetailResponse {
  aggregation_level: AggregationLevel;
  points: DetailPoint[];
  failure_windows: FailureWindow[];
}
