import {
  DistributionEnum,
  DurationOption,
} from '../../distribution/models/statistical-distribution.model';

export interface MaxRelativeError {
  value: number;            // erro relativo COM SINAL em fração, ex: -0.043 (= -4,3%) ou +0.0718 (= +7,2%)
  return_period: number;    // ex: 100
  duration_minutes: number; // ex: 5
}

export interface ThetaBoundFlag {
  at_bound: boolean;
  bound: 'lower' | 'upper' | null;
  limit_value: number | null; // 0.1 ou 10.0 quando at_bound === true
}

export interface ExtrapolationFlag {
  has_extrapolation: boolean;
  sample_size_years: number;             // tamanho efetivo n da amostra usada na Distribuição
  extrapolated_return_periods: number[]; // TRs onde TR > sample_size_years (ex: [25, 50, 100])
}

export interface HistoricalIdfFlags {
  theta_bound: ThetaBoundFlag;
  extrapolation: ExtrapolationFlag;
}

export interface DenseGrid {
  durations_minutes: number[];              // ~100 pontos log-espaçados + durações exatas da etapa
  intensities_mm_h: Record<string, number[]>; // chaves "2", "5", "10", "25", "50", "100"
}

export interface HistoricalIdfResponse {
  project_id: string;
  step_id: string;
  status: 'COMPLETED';
  lambda: number;
  kappa: number;
  eta: number;
  theta: number;
  r2: number;
  max_error: MaxRelativeError;
  distribution: DistributionEnum;
  return_periods: number[];                   // [2, 5, 10, 25, 50, 100]
  durations: DurationOption[];                // quantidade variável conforme o método (ex: 6, 9 ou 12 durações)
  quantiles_mm_h: Record<string, number[]>;   // por TR (string) -> alinhado por índice com `durations`
  equation_mm_h: Record<string, number[]>;    // por TR (string) -> alinhado por índice com `durations`
  relative_error: Record<string, number[]>;   // (i_eq - i_quantil) / i_quantil COM SINAL, em fração
  flags: HistoricalIdfFlags;
  library_versions: Record<string, string>;
  dense_grid: DenseGrid;
}

