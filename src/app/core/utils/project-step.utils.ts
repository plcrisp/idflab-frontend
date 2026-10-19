import { StepEnum } from '../models/api/project.model';

export const STEP_ORDER: readonly StepEnum[] = [
  'INITIAL_VISUALIZATION',
  'CONSISTENCY',
  'GAP_FILLING',
  'TEMPORAL_RESOLUTION',
  'DISTRIBUTION',
  'HISTORICAL_IDF',
  'FUTURE_SCENARIOS',
] as const;

export const STEP_ROUTE_MAP: Record<StepEnum, string> = {
  INITIAL_VISUALIZATION: 'initial-view',
  CONSISTENCY: 'consistency-check',
  GAP_FILLING: 'gap-filling',
  TEMPORAL_RESOLUTION: 'temporal-disaggregation',
  DISTRIBUTION: 'distribuicao-estatistica',
  HISTORICAL_IDF: 'idf-historica',
  FUTURE_SCENARIOS: 'cenarios-futuros',
  RESULTS: 'cenarios-futuros',
};

export const ROUTE_STEP_MAP: Record<string, StepEnum> = {
  'initial-view': 'INITIAL_VISUALIZATION',
  'initial-visualization': 'INITIAL_VISUALIZATION',
  'consistency-check': 'CONSISTENCY',
  'consistency': 'CONSISTENCY',
  'gap-filling': 'GAP_FILLING',
  'tratamento-de-falhas': 'GAP_FILLING',
  'temporal-disaggregation': 'TEMPORAL_RESOLUTION',
  'temporal-resolution': 'TEMPORAL_RESOLUTION',
  'resolucao-temporal': 'TEMPORAL_RESOLUTION',
  'distribuicao-estatistica': 'DISTRIBUTION',
  'distribution': 'DISTRIBUTION',
  'idf-historica': 'HISTORICAL_IDF',
  'historical-idf': 'HISTORICAL_IDF',
  'cenarios-futuros': 'FUTURE_SCENARIOS',
  'future-scenarios': 'FUTURE_SCENARIOS',
  'resultados': 'FUTURE_SCENARIOS',
  'results': 'FUTURE_SCENARIOS',
};

export function getRouteForStep(step: StepEnum): string {
  return STEP_ROUTE_MAP[step] ?? 'initial-view';
}

export function getStepForRoute(routeSegment: string): StepEnum | null {
  return ROUTE_STEP_MAP[routeSegment] ?? null;
}

export function getStepIndex(step: StepEnum): number {
  if (step === 'RESULTS') {
    return STEP_ORDER.indexOf('FUTURE_SCENARIOS');
  }
  return STEP_ORDER.indexOf(step);
}

export function isStepBeyond(targetStep: StepEnum, furthestStep: StepEnum): boolean {
  const targetIndex = getStepIndex(targetStep);
  const furthestIndex = getStepIndex(furthestStep);
  if (targetIndex === -1 || furthestIndex === -1) {
    return false;
  }
  return targetIndex > furthestIndex;
}

export interface AnalysisStepDef {
  label: string;
  path: string;
}

export const ANALYSIS_STEPS: readonly AnalysisStepDef[] = [
  { label: 'Mapa', path: 'interactive-map' },
  { label: 'Visualização inicial', path: 'initial-view' },
  { label: 'Verificação de consistência', path: 'consistency-check' },
  { label: 'Tratamento de falhas', path: 'gap-filling' },
  { label: 'Resolução temporal', path: 'temporal-disaggregation' },
  { label: 'Distribuição estatística', path: 'distribuicao-estatistica' },
  { label: 'IDF histórica', path: 'idf-historica' },
  { label: 'Cenários futuros', path: 'cenarios-futuros' },
] as const;

export const PROJECT_PIPELINE_STEPS = ANALYSIS_STEPS.filter(
  (step) => step.path !== 'interactive-map',
);

export function getProjectPipelineStepInfo(furthestStep: StepEnum): {
  number: number;
  total: number;
  label: string;
  percent: number;
} {
  const route = getRouteForStep(furthestStep);
  const index = PROJECT_PIPELINE_STEPS.findIndex((s) => s.path === route);
  const stepIndex = index >= 0 ? index : 0;
  const current = PROJECT_PIPELINE_STEPS[stepIndex];
  const number = stepIndex + 1;
  const total = PROJECT_PIPELINE_STEPS.length;
  const percent = Math.round((number / total) * 100);

  return {
    number,
    total,
    label: current.label,
    percent,
  };
}

