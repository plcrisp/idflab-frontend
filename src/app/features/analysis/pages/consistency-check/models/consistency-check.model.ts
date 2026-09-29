export type ConfirmationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NeighborProgressInfo {
  message?: string;
  percentage?: number;
}

export interface ConsistencyPeriod {
  start: string; // ISO date 'YYYY-MM-DD'
  end: string;
}

export interface DoubleMassPoint {
  x: number;
  y: number;
}

export interface DoubleMassResult {
  points: DoubleMassPoint[];
  total_points: number;
}

export interface PearsonResult {
  value: number;
  label: 'weak' | 'moderate' | 'strong';
  n_days: number;
}

export interface CoverageResult {
  percentage: number | null;
  principal_failure_days: number;
  fillable_days: number;
}

export interface ConsistencyCheckResponse {
  principal_station_id: string;
  neighbor_station_id: string;
  period: ConsistencyPeriod;
  resolution: string;
  overlap_days: number;
  double_mass: DoubleMassResult;
  pearson: PearsonResult;
  coverage: CoverageResult;
}
