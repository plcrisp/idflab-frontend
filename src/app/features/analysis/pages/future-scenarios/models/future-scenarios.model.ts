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

export interface ModelYearRange {
  minYear: number;
  maxYear: number;
}

export const CLIMATE_MODEL_YEAR_RANGES: Record<ClimateModel, ModelYearRange> = {
  MIROC6: { minYear: 2015, maxYear: 2100 },
  'EC-EARTH3': { minYear: 2015, maxYear: 2100 },
  'MRI-ESM2': { minYear: 2015, maxYear: 2100 },
  'ACCESS-CM2': { minYear: 2015, maxYear: 2100 },
  'HadGEM3-GC31-LL': { minYear: 2015, maxYear: 2100 },
};

export function getDefaultFutureStartYear(): number {
  return new Date().getFullYear() + 1;
}

export function getDefaultFutureEndYear(): number {
  return 2100;
}

export interface ClimateModelConfig {
  code: ClimateModel;
  name: string;
  resolutionBadge: string;
  resolutionDetails: string;
  institution: string;
  color: string;
  sspRanges: Record<SspScenario, string>;
}

export const CLIMATE_MODEL_CONFIGS: Record<ClimateModel, ClimateModelConfig> = {
  MIROC6: {
    code: 'MIROC6',
    name: 'MIROC6',
    resolutionBadge: '~150 km',
    resolutionDetails: '~1.4° (~150 km)',
    institution: 'JAMSTEC / Univ. Tokyo / NIES (Japão)',
    color: '#3b82f6',
    sspRanges: {
      SSP245: '2015 - 2100',
      SSP585: '2015 - 2100',
    },
  },
  'EC-EARTH3': {
    code: 'EC-EARTH3',
    name: 'EC-EARTH3',
    resolutionBadge: '~80 km',
    resolutionDetails: '~0.7° (~80 km)',
    institution: 'Consórcio EC-Earth (Europa)',
    color: '#10b981',
    sspRanges: {
      SSP245: '2015 - 2100',
      SSP585: '2015 - 2100',
    },
  },
  'MRI-ESM2': {
    code: 'MRI-ESM2',
    name: 'MRI-ESM2',
    resolutionBadge: '~100 km',
    resolutionDetails: '~1.1° (~100 km)',
    institution: 'MRI (Japão)',
    color: '#8b5cf6',
    sspRanges: {
      SSP245: '2015 - 2100',
      SSP585: '2015 - 2100',
    },
  },
  'ACCESS-CM2': {
    code: 'ACCESS-CM2',
    name: 'ACCESS-CM2',
    resolutionBadge: '~150 km',
    resolutionDetails: '~1.25° × 1.875° (~150 km)',
    institution: 'CSIRO / BoM (Austrália)',
    color: '#06b6d4',
    sspRanges: {
      SSP245: '2015 - 2100',
      SSP585: '2015 - 2100',
    },
  },
  'HadGEM3-GC31-LL': {
    code: 'HadGEM3-GC31-LL',
    name: 'HadGEM3-GC31-LL',
    resolutionBadge: '~135 km',
    resolutionDetails: '~1.25° × 1.875° (~135 km)',
    institution: 'Met Office Hadley Centre (Reino Unido)',
    color: '#f43f5e',
    sspRanges: {
      SSP245: '2015 - 2100',
      SSP585: '2015 - 2100',
    },
  },
};

export const CLIMATE_MODEL_LIST: readonly ClimateModelConfig[] = [
  CLIMATE_MODEL_CONFIGS['MIROC6'],
  CLIMATE_MODEL_CONFIGS['EC-EARTH3'],
  CLIMATE_MODEL_CONFIGS['MRI-ESM2'],
  CLIMATE_MODEL_CONFIGS['ACCESS-CM2'],
  CLIMATE_MODEL_CONFIGS['HadGEM3-GC31-LL'],
];

export type SspScenario = 'SSP245' | 'SSP585';

export interface SspScenarioInfo {
  code: SspScenario;
  label: string;
  description: string;
}

export const SSP_SCENARIO_INFOS: Record<SspScenario, SspScenarioInfo> = {
  SSP245: {
    code: 'SSP245',
    label: 'SSP2-4.5',
    description:
      'Cenário intermediário de emissões, com mitigação moderada. Trajetória em que as tendências atuais seguem sem grandes rupturas.',
  },
  SSP585: {
    code: 'SSP585',
    label: 'SSP5-8.5',
    description:
      'Cenário de altas emissões, baseado em intenso uso de combustíveis fósseis. É o mais pessimista dos dois.',
  },
};

export const SSP_SCENARIO_LIST: readonly SspScenarioInfo[] = [
  SSP_SCENARIO_INFOS.SSP245,
  SSP_SCENARIO_INFOS.SSP585,
];

export const REFERENCE_WINDOW_DESCRIPTION =
  'Período histórico em que o modelo climático é comparado com a série observada para estimar o viés. A correção aprendida nessa janela é aplicada à janela futura escolhida.';

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

