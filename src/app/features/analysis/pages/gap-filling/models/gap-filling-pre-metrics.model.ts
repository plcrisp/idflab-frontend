export type GapFillingWarning =
  | 'NO_OVERLAP'
  | 'SHORT_OVERLAP'
  | 'LOW_CORRELATION'
  | 'DIFFERENT_RESOLUTION'
  | 'LONG_GAP'
  | 'NO_GAPS';

export interface GapFillingPreMetrics {
  pearson_r: number | null;
  valid_pairs: number;
  overlap_years: number;
  fillable_coverage_pct: number;
  total_gaps: number;
  fillable_gaps: number;
  remaining_gaps: number;
  complete_years_before: number;
  complete_years_predicted: number;
  longest_gap_days: number;
  accumulated_ratio: number | null;
}

export interface GapFillingPreMetricsResponse {
  metrics: GapFillingPreMetrics;
  warnings: GapFillingWarning[];
}

export type ReliabilityLevel = 'Boa' | 'Moderada' | 'Fraca';

export interface ReliabilityBadge {
  label: ReliabilityLevel;
  variant: 'success' | 'warning' | 'destructive';
}

export type WarningSeverity = 'destructive' | 'warning' | 'info';

export interface ProcessedWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
  icon: string;
  isNoGaps: boolean;
}
