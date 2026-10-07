import { RELIABILITY_THRESHOLDS } from '../constants/gap-filling-pre-metrics.constants';
import { ReliabilityBadge } from '../models/gap-filling-pre-metrics.model';

/**
 * Deriva o selo de confiabilidade a partir do coeficiente de Pearson (|r|)
 * e da sobreposição em anos entre as séries.
 *
 * Limiares:
 * - pearson_r == null -> sem selo (null)
 * - "Boa": |r| >= 0.7 e overlap_years >= 10 (variant: 'success')
 * - "Moderada": |r| >= 0.5 (e não atende "Boa") (variant: 'warning')
 * - "Fraca": demais casos (variant: 'destructive')
 */
export function getReliabilityBadge(
  pearsonR: number | null | undefined,
  overlapYears: number | null | undefined,
): ReliabilityBadge | null {
  if (pearsonR == null || Number.isNaN(pearsonR)) {
    return null;
  }

  const absR = Math.abs(pearsonR);
  const years = overlapYears ?? 0;

  if (
    absR >= RELIABILITY_THRESHOLDS.GOOD_PEARSON_ABS &&
    years >= RELIABILITY_THRESHOLDS.GOOD_MIN_OVERLAP_YEARS
  ) {
    return {
      label: 'Boa',
      variant: 'success',
    };
  }

  if (absR >= RELIABILITY_THRESHOLDS.MODERATE_PEARSON_ABS) {
    return {
      label: 'Moderada',
      variant: 'warning',
    };
  }

  return {
    label: 'Fraca',
    variant: 'destructive',
  };
}
