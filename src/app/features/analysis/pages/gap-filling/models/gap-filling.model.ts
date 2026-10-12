export interface GapFillingExecuteRequest {
  neighbor_station_id: string;
  method?: 'random_forest';
}

export interface GapFillingJobResponse {
  job_id: string;
  project_id: string;
  step_id: string;
  status: string;
  message: string;
}

export interface GapFillingPostMetrics {
  filled_count: number;
  remaining_gaps_pct: number;
  complete_years_after: number;
  model_score_r2: number;
  model_rmse: number;
  model_mae: number;
}

export interface GapFillingDetailPoint {
  date: string;
  value: number | null;
  is_failure: boolean;
  is_filled: boolean;
  is_annual_max: boolean;
}

export interface GapFillingFailureWindow {
  start: string;
  end: string;
}

export interface GapFillingYearSummary {
  year: number;
  corrections_count: number;
}

export interface GapFillingWindow {
  start: string;
  end: string;
}

export interface GapFillingVisualizationResponse {
  aggregation_level: 'hour' | 'day' | 'month' | 'year';
  points: GapFillingDetailPoint[];
  failure_windows: GapFillingFailureWindow[];
  applied_window: GapFillingWindow;
  center_year: number | null;
  total_corrections_in_window: number;
  yearly_corrections: GapFillingYearSummary[];
}

