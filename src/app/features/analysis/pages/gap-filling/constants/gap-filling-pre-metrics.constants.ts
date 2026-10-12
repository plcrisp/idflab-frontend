import {
  GapFillingWarning,
  ProcessedWarning,
  ReliabilityBadge,
  WarningSeverity,
} from '../models/gap-filling-pre-metrics.model';

export const RELIABILITY_THRESHOLDS = {
  GOOD_PEARSON_ABS: 0.7,
  GOOD_MIN_OVERLAP_YEARS: 10,
  MODERATE_PEARSON_ABS: 0.5,
} as const;

export interface WarningConfigItem {
  code: GapFillingWarning;
  severity: WarningSeverity;
  message: string;
  icon: string;
}

export function formatLongGapWarning(days?: number | null): string {
  if (days != null && days > 0) {
    const unit = days === 1 ? 'dia' : 'dias';
    return `Há uma lacuna contínua de ${days} ${unit} na série principal. O preenchimento é menos confiável em trechos como esse.`;
  }
  return 'Há lacunas longas na série principal. O preenchimento é menos confiável nesses trechos.';
}

export const GAP_FILLING_WARNING_CONFIGS: Record<GapFillingWarning, WarningConfigItem> = {
  NO_OVERLAP: {
    code: 'NO_OVERLAP',
    severity: 'destructive',
    message: 'Esta estação não tem período em comum com a série principal.',
    icon: 'lucideTriangleAlert',
  },
  SHORT_OVERLAP: {
    code: 'SHORT_OVERLAP',
    severity: 'warning',
    message: 'O período em comum é curto. A correlação pode não ser representativa.',
    icon: 'lucideTriangleAlert',
  },
  LOW_CORRELATION: {
    code: 'LOW_CORRELATION',
    severity: 'warning',
    message: 'Correlação baixa pode reduzir a qualidade do preenchimento.',
    icon: 'lucideTriangleAlert',
  },
  DIFFERENT_RESOLUTION: {
    code: 'DIFFERENT_RESOLUTION',
    severity: 'info',
    message: 'A vizinha tem resolução horária e será agregada para escala diária.',
    icon: 'lucideInfo',
  },
  LONG_GAP: {
    code: 'LONG_GAP',
    severity: 'warning',
    message: formatLongGapWarning(null),
    icon: 'lucideTriangleAlert',
  },
  NO_GAPS: {
    code: 'NO_GAPS',
    severity: 'info',
    message: 'Nenhuma falha relevante encontrada na série.',
    icon: 'lucideInfo',
  },
};

export const UNKNOWN_WARNING_FALLBACK: { severity: WarningSeverity; icon: string; messagePrefix: string } = {
  severity: 'info',
  icon: 'lucideInfo',
  messagePrefix: 'Aviso da série:',
};

export const MAX_VISIBLE_WARNINGS = 3;

export function getAccumulatedRatioBadge(ratio: number | null | undefined): ReliabilityBadge | null {
  if (ratio == null || Number.isNaN(ratio)) {
    return null;
  }

  if (ratio >= 0.8 && ratio <= 1.2) {
    return {
      label: 'Equilibrada',
      variant: 'success',
    };
  }

  if ((ratio >= 0.6 && ratio < 0.8) || (ratio > 1.2 && ratio <= 1.4)) {
    return {
      label: 'Moderada',
      variant: 'warning',
    };
  }

  return {
    label: 'Discrepante',
    variant: 'destructive',
  };
}

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

const SEVERITY_PRIORITY: Record<WarningSeverity, number> = {
  destructive: 1,
  warning: 2,
  info: 3,
};

export interface WarningMappingContext {
  longestGapDays?: number | null;
}

export function mapGapFillingWarnings(
  warnings: (string | GapFillingWarning)[] | null | undefined,
  context?: WarningMappingContext,
): ProcessedWarning[] {
  if (!warnings || !Array.isArray(warnings)) {
    return [];
  }

  const processed: ProcessedWarning[] = warnings.map((code) => {
    const config = GAP_FILLING_WARNING_CONFIGS[code as GapFillingWarning];

    if (config) {
      let message = config.message;
      if (code === 'LONG_GAP') {
        message = formatLongGapWarning(context?.longestGapDays);
      }

      return {
        code,
        severity: config.severity,
        message,
        icon: config.icon,
        isNoGaps: code === 'NO_GAPS',
      };
    }

    return {
      code,
      severity: UNKNOWN_WARNING_FALLBACK.severity,
      message: `${UNKNOWN_WARNING_FALLBACK.messagePrefix} ${code}`,
      icon: UNKNOWN_WARNING_FALLBACK.icon,
      isNoGaps: false,
    };
  });

  return processed.sort((a, b) => {
    const prioA = SEVERITY_PRIORITY[a.severity] ?? 99;
    const prioB = SEVERITY_PRIORITY[b.severity] ?? 99;
    return prioA - prioB;
  });
}

