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

