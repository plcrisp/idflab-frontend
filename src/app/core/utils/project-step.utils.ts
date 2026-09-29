import { StepEnum } from '../models/api/project.model';

export const STEP_ORDER: readonly StepEnum[] = [
  'INITIAL_VISUALIZATION',
  'CONSISTENCY',
  'GAP_FILLING',
  'TEMPORAL_RESOLUTION',
  'DISTRIBUTION',
  'HISTORICAL_IDF',
  'FUTURE_SCENARIOS',
  'RESULTS',
] as const;

export const STEP_ROUTE_MAP: Record<StepEnum, string> = {
  INITIAL_VISUALIZATION: 'initial-view',
  CONSISTENCY: 'consistency-check',
  GAP_FILLING: 'tratamento-de-falhas',
  TEMPORAL_RESOLUTION: 'resolucao-temporal',
  DISTRIBUTION: 'distribuicao-estatistica',
  HISTORICAL_IDF: 'idf-historica',
  FUTURE_SCENARIOS: 'cenarios-futuros',
  RESULTS: 'resultados',
};

export const ROUTE_STEP_MAP: Record<string, StepEnum> = {
  'initial-view': 'INITIAL_VISUALIZATION',
  'initial-visualization': 'INITIAL_VISUALIZATION',
  'consistency-check': 'CONSISTENCY',
  'consistency': 'CONSISTENCY',
  'tratamento-de-falhas': 'GAP_FILLING',
  'gap-filling': 'GAP_FILLING',
  'resolucao-temporal': 'TEMPORAL_RESOLUTION',
  'temporal-resolution': 'TEMPORAL_RESOLUTION',
  'distribuicao-estatistica': 'DISTRIBUTION',
  'distribution': 'DISTRIBUTION',
  'idf-historica': 'HISTORICAL_IDF',
  'historical-idf': 'HISTORICAL_IDF',
  'cenarios-futuros': 'FUTURE_SCENARIOS',
  'future-scenarios': 'FUTURE_SCENARIOS',
  'resultados': 'RESULTS',
  'results': 'RESULTS',
};

export function getRouteForStep(step: StepEnum): string {
  return STEP_ROUTE_MAP[step] ?? 'initial-view';
}

export function getStepForRoute(routeSegment: string): StepEnum | null {
  return ROUTE_STEP_MAP[routeSegment] ?? null;
}

export function getStepIndex(step: StepEnum): number {
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
