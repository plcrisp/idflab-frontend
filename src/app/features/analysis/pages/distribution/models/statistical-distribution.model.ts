export type DistributionEnum =
  | 'GUMBEL'
  | 'LOGNORMAL_3P'
  | 'GEV'
  | 'GLO'
  | 'PEARSON_3';

export type SelectionOrigin = 'auto' | 'manual';
export type FitStatus = 'ok' | 'failed';
export type TableRowStatus = 'ok' | 'incomplete' | 'failed';

export interface QuantilesMmH {
  tr_10: number;
  tr_50: number;
  tr_100: number;
}

export interface DurationOption {
  duration_minutes: number;
  label: string;
}

export interface DisaggregationInfo {
  method: string;
  calibration_station_name: string | null;
}

export interface DistributionSelection {
  selected_distribution: DistributionEnum;
  selection_origin: SelectionOrigin;
}

export interface DistributionTableItem {
  distribution: DistributionEnum;
  status: TableRowStatus;
  total_sse: number | null;
  failed_durations: number[];
}

export interface DistributionStateResponse {
  project_id: string;
  step_id: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  sample_size_years: number;
  is_small_sample: boolean;
  disaggregation: DisaggregationInfo;
  available_durations: DurationOption[];
  suggested_distribution: DistributionEnum | null;
  selection: DistributionSelection | null;
  selection_table: DistributionTableItem[];
}

export interface AnnualMaximumItem {
  year: number;
  value: number;
}

export interface DurationDistributionItem {
  distribution: DistributionEnum;
  status: FitStatus;
  error?: string | null;
  error_message?: string | null;
  pdf_density?: (number | null)[] | null;
  sse?: number | null;
  quantiles?: QuantilesMmH | null;
}

export interface DurationDetailResponse {
  duration_minutes: number;
  duration_label: string;
  sample_size_years: number;
  historical_max_year: number;
  historical_max_value: number;
  annual_maximums: AnnualMaximumItem[];
  n_bins: number;
  bin_edges: number[];
  empirical_density: number[];
  curve_x: number[];
  distributions: DurationDistributionItem[];
}

export interface DistributionSelectionRequest {
  selected_distribution: DistributionEnum;
  selection_origin: SelectionOrigin;
}

export interface DistributionSelectionResponse {
  project_id: string;
  step_id: string;
  selected_distribution: DistributionEnum;
  selection_origin: SelectionOrigin;
}

