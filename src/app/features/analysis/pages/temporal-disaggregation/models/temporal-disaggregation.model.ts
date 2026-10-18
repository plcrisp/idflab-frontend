export interface CetesbFactorItem {
  duration_minutes: number;
  label: string;
  factor: number;
}

export interface DurationSeriesItem {
  duration_minutes: number;
  label: string;
  factor: number;
  values: Record<string, number>;
  mean: number;
}

export interface CetesbExecutionResult {
  method: 'CETESB';
  source: 'original' | 'filled';
  years: number[];
  durations: DurationSeriesItem[];
  daily_maximums: Record<string, number>;
  daily_mean?: number;
}

export interface CetesbExecutionResponse {
  project_id: string;
  step_id: string;
  status: string;
  result: CetesbExecutionResult;
}
export interface TableColumn {
  duration_minutes: number;
  label: string;
}

export interface TableRow {
  year: number;
  values: number[];
}

export interface TemporalDisaggregationTableResponse {
  method: string;
  source: string;
  columns: TableColumn[];
  rows: TableRow[];
  page: number;
  page_size: number;
  total_years: number;
}

export interface DecayCurvePoint {
  duration_minutes: number;
  label: string;
  max_intensity_mm_h: number;
  mean_intensity_mm_h: number;
  max_depth_mm: number;
  mean_depth_mm: number;
}

export interface TemporalDisaggregationDecayCurveResponse {
  method: string;
  source: string;
  max_year: number;
  max_daily_mm: number;
  points: DecayCurvePoint[];
}
