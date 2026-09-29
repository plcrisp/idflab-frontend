import { ConsistencyPeriod } from './consistency-check.model';

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

export interface GapFillingViabilityResponse {
  principal_station_id: string;
  neighbor_station_id: string;
  period: ConsistencyPeriod;
  resolution: string;
  overlap_days: number;
  pearson: PearsonResult;
  coverage: CoverageResult;
}
