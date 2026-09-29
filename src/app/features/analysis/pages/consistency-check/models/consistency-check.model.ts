import { ConfirmationStatus, NeighborProgressInfo } from '../../../shared/models/analysis.models';
import { PearsonResult, CoverageResult } from './gap-filling.model';

export type { ConfirmationStatus, NeighborProgressInfo };
export type { PearsonResult, CoverageResult };

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

/**
 * Contrato da rota de consistência: retorna exclusivamente a dupla massa.
 * pearson e coverage são marcados como opcionais para compatibilidade retroativa
 * caso o backend ainda esteja em transição.
 */
export interface ConsistencyCheckResponse {
  principal_station_id: string;
  neighbor_station_id: string;
  period: ConsistencyPeriod;
  resolution: string;
  overlap_days: number;
  double_mass: DoubleMassResult;
  pearson?: PearsonResult;
  coverage?: CoverageResult;
}
