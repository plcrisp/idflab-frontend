import { describe, expect, it } from 'vitest';
import {
  getRouteForStep,
  getStepForRoute,
  getStepIndex,
  isStepBeyond,
  ROUTE_STEP_MAP,
  STEP_ORDER,
  STEP_ROUTE_MAP,
} from './project-step.utils';
import { StepEnum } from '../models/api/project.model';

describe('Project Step Utils', () => {
  it('should have all 8 steps in the correct order', () => {
    expect(STEP_ORDER).toEqual([
      'INITIAL_VISUALIZATION',
      'CONSISTENCY',
      'GAP_FILLING',
      'TEMPORAL_RESOLUTION',
      'DISTRIBUTION',
      'HISTORICAL_IDF',
      'FUTURE_SCENARIOS',
      'RESULTS',
    ]);
  });

  describe('STEP_ROUTE_MAP and getRouteForStep', () => {
    it('should map each step to its respective route', () => {
      expect(getRouteForStep('INITIAL_VISUALIZATION')).toBe('initial-view');
      expect(getRouteForStep('CONSISTENCY')).toBe('consistency-check');
      expect(getRouteForStep('GAP_FILLING')).toBe('tratamento-de-falhas');
      expect(getRouteForStep('TEMPORAL_RESOLUTION')).toBe('resolucao-temporal');
      expect(getRouteForStep('DISTRIBUTION')).toBe('distribuicao-estatistica');
      expect(getRouteForStep('HISTORICAL_IDF')).toBe('idf-historica');
      expect(getRouteForStep('FUTURE_SCENARIOS')).toBe('cenarios-futuros');
      expect(getRouteForStep('RESULTS')).toBe('resultados');
    });

    it('should fallback safely for unknown step', () => {
      expect(getRouteForStep('UNKNOWN_STEP' as StepEnum)).toBe('initial-view');
    });
  });

  describe('ROUTE_STEP_MAP and getStepForRoute', () => {
    it('should map route segments to their StepEnum', () => {
      expect(getStepForRoute('initial-view')).toBe('INITIAL_VISUALIZATION');
      expect(getStepForRoute('consistency-check')).toBe('CONSISTENCY');
      expect(getStepForRoute('tratamento-de-falhas')).toBe('GAP_FILLING');
      expect(getStepForRoute('resolucao-temporal')).toBe('TEMPORAL_RESOLUTION');
      expect(getStepForRoute('distribuicao-estatistica')).toBe('DISTRIBUTION');
      expect(getStepForRoute('idf-historica')).toBe('HISTORICAL_IDF');
      expect(getStepForRoute('cenarios-futuros')).toBe('FUTURE_SCENARIOS');
      expect(getStepForRoute('resultados')).toBe('RESULTS');
    });

    it('should support English route aliases', () => {
      expect(getStepForRoute('initial-visualization')).toBe('INITIAL_VISUALIZATION');
      expect(getStepForRoute('consistency')).toBe('CONSISTENCY');
      expect(getStepForRoute('gap-filling')).toBe('GAP_FILLING');
      expect(getStepForRoute('temporal-resolution')).toBe('TEMPORAL_RESOLUTION');
      expect(getStepForRoute('distribution')).toBe('DISTRIBUTION');
      expect(getStepForRoute('historical-idf')).toBe('HISTORICAL_IDF');
      expect(getStepForRoute('future-scenarios')).toBe('FUTURE_SCENARIOS');
      expect(getStepForRoute('results')).toBe('RESULTS');
    });

    it('should return null for unknown route segment', () => {
      expect(getStepForRoute('unknown-route')).toBeNull();
    });
  });

  describe('isStepBeyond', () => {
    it('should return true when target step is ahead of furthest step', () => {
      expect(isStepBeyond('CONSISTENCY', 'INITIAL_VISUALIZATION')).toBe(true);
      expect(isStepBeyond('GAP_FILLING', 'CONSISTENCY')).toBe(true);
      expect(isStepBeyond('RESULTS', 'INITIAL_VISUALIZATION')).toBe(true);
      expect(isStepBeyond('RESULTS', 'FUTURE_SCENARIOS')).toBe(true);
    });

    it('should return false when target step is equal to furthest step', () => {
      expect(isStepBeyond('INITIAL_VISUALIZATION', 'INITIAL_VISUALIZATION')).toBe(false);
      expect(isStepBeyond('CONSISTENCY', 'CONSISTENCY')).toBe(false);
      expect(isStepBeyond('RESULTS', 'RESULTS')).toBe(false);
    });

    it('should return false when target step is before furthest step', () => {
      expect(isStepBeyond('INITIAL_VISUALIZATION', 'CONSISTENCY')).toBe(false);
      expect(isStepBeyond('INITIAL_VISUALIZATION', 'RESULTS')).toBe(false);
      expect(isStepBeyond('CONSISTENCY', 'RESULTS')).toBe(false);
    });

    it('should return false if either step is invalid', () => {
      expect(isStepBeyond('INVALID' as any, 'CONSISTENCY')).toBe(false);
      expect(isStepBeyond('CONSISTENCY', 'INVALID' as any)).toBe(false);
    });
  });
});
