import {
  formatLongGapWarning,
  GAP_FILLING_WARNING_CONFIGS,
  UNKNOWN_WARNING_FALLBACK,
} from '../constants/gap-filling-pre-metrics.constants';
import {
  GapFillingWarning,
  ProcessedWarning,
  WarningSeverity,
} from '../models/gap-filling-pre-metrics.model';

const SEVERITY_PRIORITY: Record<WarningSeverity, number> = {
  destructive: 1,
  warning: 2,
  info: 3,
};

export interface WarningMappingContext {
  longestGapDays?: number | null;
}

/**
 * Mapeia e ordena os avisos retornados pelo backend para exibição no front-end.
 *
 * Ordem de exibição: erro (destructive), aviso (warning), informativo (info).
 * Trata códigos desconhecidos com fallback genérico.
 * Se context.longestGapDays for fornecido, interpola a quantidade de dias no aviso LONG_GAP.
 */
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
