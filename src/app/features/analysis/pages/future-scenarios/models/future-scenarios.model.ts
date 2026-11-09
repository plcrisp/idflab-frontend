import { JobStatus } from '../../../../../core/models/api/job.model';
import { StepStatus } from '../../../../../core/models/api/project-step.model';
import { DistributionEnum } from '../../distribution/models/statistical-distribution.model';

export type BiasCorrectionMethod = 'QM' | 'DBC' | 'EQM';

export type ClimateModel =
  | 'MIROC6'
  | 'EC-EARTH3'
  | 'MRI-ESM2'
  | 'ACCESS-CM2'
  | 'HadGEM3-GC31-LL';

export type SspScenario = 'SSP245' | 'SSP585';

export type FutureScenariosUiState =
  | 'INITIAL'
  | 'PROCESSING'
  | 'RESULT'
  | 'OUTDATED'
  | 'ERROR'
  | 'BLOCKED';

export type FutureScenariosBlockReason =
  | 'CEMADEN'
  | 'INSUFFICIENT_OVERLAP'
  | 'OUT_OF_COVERAGE';

export type InheritedDisaggregationMethod =
  | 'CETESB'
  | 'BARTLETT_LEWIS'
  | 'DIRECT_AGGREGATION';

export interface FutureScenariosParams {
  method: BiasCorrectionMethod | null;
  model: ClimateModel;
  ssp: SspScenario;
  period: string;
  start_year: number;
  end_year: number;
}

export interface FutureScenariosAppliedParams {
  method: BiasCorrectionMethod;
  model: ClimateModel;
  ssp: SspScenario;
  period: string;
  start_year: number;
  end_year: number;
}

export interface FutureScenariosApplyRequest {
  method: BiasCorrectionMethod;
  model: ClimateModel;
  ssp: SspScenario;
  period?: string;
  start_year?: number;
  end_year?: number;
}

export interface FutureScenariosStateQuery {
  method?: BiasCorrectionMethod | null;
  model?: ClimateModel | null;
  ssp?: SspScenario | null;
  period?: string | null;
  start_year?: number | null;
  end_year?: number | null;
}

export interface ClimbraCell {
  lat_idx: number;
  lon_idx: number;
  lat: number;
  lon: number;
}

export interface EffectiveReferenceWindow {
  start_year: number;
  end_year: number;
  n_years: number;
  years: number[];
  label: string;
}

export interface FutureScenariosCards {
  observed_mean_mm: number;
  reference_window_label: string;
  raw_model_mean_mm: number;
  raw_model_delta_pct: number;
  corrected_model_mean_mm: number;
  corrected_model_delta_pct: number;
}

export interface FutureAnnualMaximumItem {
  year: number;
  raw_mm: number;
  corrected_mm: number;
}

export interface FutureSeries {
  period: string;
  start_year: number;
  end_year: number;
  raw_mean_mm: number;
  corrected_mean_mm: number;
  observed_reference_mean_mm: number;
  annual_maximums: FutureAnnualMaximumItem[];
}

export interface FutureScenariosResult {
  applied_params: FutureScenariosAppliedParams;
  analysis_radius_km: number;
  cells: ClimbraCell[];
  effective_reference_window: EffectiveReferenceWindow;
  climbra_version: string;
  zarr_version: string;
  inherited_disaggregation: InheritedDisaggregationMethod;
  inherited_distribution: DistributionEnum;
  cards: FutureScenariosCards;
  future_series: FutureSeries;
  library_versions: Record<string, string>;
}

export interface FutureScenariosStateResponse {
  project_id: string;
  step_id: string | null;
  status: StepStatus;
  ui_state: FutureScenariosUiState;
  can_apply: boolean;
  can_advance: boolean;
  inherited_disaggregation: InheritedDisaggregationMethod | null;
  inherited_distribution: DistributionEnum | null;
  inherited_subtitle: string | null;
  params: FutureScenariosParams | null;
  result: FutureScenariosResult | null;
  job_id: string | null;
  job_progress: number | null;
  job_message: string | null;
  block_reason: FutureScenariosBlockReason | null;
  message: string | null;
}

export interface FutureScenariosJobResponse {
  job_id: string;
  project_id: string;
  step_id: string;
  status: JobStatus;
  message: string;
}

