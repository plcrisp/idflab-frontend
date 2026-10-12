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
