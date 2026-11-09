import { StepStatus } from '../../../../../core/models/api/project-step.model';
import {
  DistributionEnum,
  DurationOption,
} from '../../distribution/models/statistical-distribution.model';
import {
  ClimbraCell,
  EffectiveReferenceWindow,
  FutureScenariosAppliedParams,
  FutureScenariosCards,
  InheritedDisaggregationMethod,
} from '../../future-scenarios/models/future-scenarios.model';
import {
  DenseGrid,
  HistoricalIdfFlags,
  MaxRelativeError,
} from '../../historical-idf/models/historical-idf.model';

export interface ResultIdfBlock {
  k: number;
  m: number;
  n: number;
  t0: number;
  r2: number;
  max_error: MaxRelativeError;
  quantiles_mm_h: Record<string, number[]>;
  equation_mm_h: Record<string, number[]>;
  relative_error: Record<string, number[]>;
  flags: HistoricalIdfFlags;
}

export interface ResultsMetadata {
  applied_params: FutureScenariosAppliedParams;
  config_subtitle: string;
  analysis_radius_km: number;
  cells: ClimbraCell[];
  effective_reference_window: EffectiveReferenceWindow;
  climbra_version: string;
  zarr_version: string;
  inherited_disaggregation: InheritedDisaggregationMethod;
  inherited_distribution: DistributionEnum;
  cards: FutureScenariosCards;
}

export interface ResultsResponse {
  project_id: string;
  step_id: string;
  status: StepStatus;
  applied_params: FutureScenariosAppliedParams;
  config_subtitle: string;
  distribution: DistributionEnum;
  disaggregation_method: InheritedDisaggregationMethod;
  return_periods: number[];
  durations: DurationOption[];
  historical_idf: ResultIdfBlock;
  future_idf: ResultIdfBlock;
  intensity_table_mm_h: Record<string, number[]>;
  variation_pct: Record<string, number[]>;
  metadata: ResultsMetadata;
  historical_dense_grid: DenseGrid;
  future_dense_grid: DenseGrid;
}

