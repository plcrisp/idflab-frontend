import { StatCardSemanticVariant } from '../../../shared/models/analysis.models';

export const QUALITY_THRESHOLDS = {
  GOOD_R2: 0.75,
  ACCEPTABLE_R2: 0.50,
} as const;

export type QualityLevel = 'good' | 'acceptable' | 'poor' | 'unavailable';

export const QUALITY_FOOTER_PHRASES: Record<QualityLevel, string> = {
  good: 'Preenchimento confiável para uso na análise.',
  acceptable: 'Adequado, mas pode errar em dias de chuva forte.',
  poor: 'Pouco confiável. Considere escolher outra estação vizinha.',
  unavailable: 'Métricas de qualidade indisponíveis para este modelo.',
};

export interface QualityAssessment {
  level: QualityLevel;
  badgeLabel: string;
  badgeVariant: StatCardSemanticVariant;
  phrase: string;
  isAvailable: boolean;
  valueFormatted: string;
  progressPercent: number | null;
}

export function getQualityAssessment(r2: number | null | undefined): QualityAssessment {
  if (r2 == null || Number.isNaN(r2)) {
    return {
      level: 'unavailable',
      badgeLabel: 'Indisponível',
      badgeVariant: 'default',
      phrase: QUALITY_FOOTER_PHRASES.unavailable,
      isAvailable: false,
      valueFormatted: '—',
      progressPercent: null,
    };
  }

  // Caso de borda: R² negativo
  if (r2 < 0) {
    return {
      level: 'poor',
      badgeLabel: 'Fraco',
      badgeVariant: 'destructive',
      phrase: QUALITY_FOOTER_PHRASES.poor,
      isAvailable: false,
      valueFormatted: '—',
      progressPercent: null,
    };
  }

  const valueFormatted = r2.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const progressPercent = Math.min(100, Math.max(0, r2 * 100));

  if (r2 >= QUALITY_THRESHOLDS.GOOD_R2) {
    return {
      level: 'good',
      badgeLabel: 'Bom',
      badgeVariant: 'success',
      phrase: QUALITY_FOOTER_PHRASES.good,
      isAvailable: true,
      valueFormatted,
      progressPercent,
    };
  }

  if (r2 >= QUALITY_THRESHOLDS.ACCEPTABLE_R2) {
    return {
      level: 'acceptable',
      badgeLabel: 'Aceitável',
      badgeVariant: 'warning',
      phrase: QUALITY_FOOTER_PHRASES.acceptable,
      isAvailable: true,
      valueFormatted,
      progressPercent,
    };
  }

  return {
    level: 'poor',
    badgeLabel: 'Fraco',
    badgeVariant: 'destructive',
    phrase: QUALITY_FOOTER_PHRASES.poor,
    isAvailable: true,
    valueFormatted,
    progressPercent,
  };
}

