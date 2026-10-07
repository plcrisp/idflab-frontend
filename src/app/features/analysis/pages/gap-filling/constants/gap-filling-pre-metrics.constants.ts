import { GapFillingWarning, WarningSeverity } from '../models/gap-filling-pre-metrics.model';

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
    message: 'Correlação baixa pode reduzir a qualidade do preenchimento. A decisão é sua.',
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

export const GAP_FILLING_I18N = {
  groups: {
    relationship: 'Relação entre estações',
    fillingScope: 'O que será preenchido',
  },
  labels: {
    pearson: 'Correlação de Pearson',
    validPairs: 'Pares válidos',
    overlapYears: 'Sobreposição',
    accumulatedRatio: 'Razão entre acumulados',
    fillableCoverage: 'Cobertura preenchível',
    totalGaps: 'Falhas totais',
    fillableGaps: 'Preenchíveis',
    remainingGaps: 'Permanecerão',
    completeYears: 'Anos completos',
  },
  tooltips: {
    pearson:
      'Grau de associação linear diária entre as chuvas das duas estações (-1 a +1). Valores mais altos indicam maior sincronia pluviométrica.',
    validPairs:
      'Total de dias com medições simultâneas em ambas as estações no mesmo intervalo temporal, base para os cálculos estatísticos.',
    overlapYears:
      'Número de anos em que ambas as estações operaram concomitantemente com dados válidos.',
    accumulatedRatio:
      'Razão da precipitação acumulada (Principal ÷ Vizinha) no período comum. Valores próximos a 1,0 indicam volumes anuais equilibrados entre as bacias.',
  },
  actions: {
    retry: 'Tentar novamente',
    skipStep: 'Pular etapa',
    seeMore: 'Ver mais',
    seeLess: 'Ver menos',
    fillGapsPrefix: 'Preencher falhas com',
    fillGapsFallback: 'Preencher falhas com a estação selecionada',
  },
  messages: {
    empty: 'Nenhuma estação vizinha selecionada. Selecione uma estação acima para visualizar as métricas de pré-preenchimento.',
    errorPrefix: 'Não foi possível carregar as métricas pré-preenchimento.',
    noOverlapMetricPlaceholder: '—',
  },
  maxVisibleWarnings: 3,
} as const;
