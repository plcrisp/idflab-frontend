import { describe, expect, it } from 'vitest';
import {
  getQualityAssessment,
  QUALITY_THRESHOLDS,
  QUALITY_FOOTER_PHRASES,
} from './gap-filling-post-metrics.constants';

describe('getQualityAssessment', () => {
  it('classifies R² >= 0.75 as Bom (good)', () => {
    const result = getQualityAssessment(0.75);
    expect(result.level).toBe('good');
    expect(result.badgeLabel).toBe('Bom');
    expect(result.badgeVariant).toBe('success');
    expect(result.phrase).toBe(QUALITY_FOOTER_PHRASES.good);
    expect(result.isAvailable).toBe(true);
    expect(result.valueFormatted).toBe('0,75');
    expect(result.progressPercent).toBe(75);
  });

  it('classifies R² = 0.85 as Bom with formatted decimal', () => {
    const result = getQualityAssessment(0.854);
    expect(result.level).toBe('good');
    expect(result.badgeLabel).toBe('Bom');
    expect(result.badgeVariant).toBe('success');
    expect(result.valueFormatted).toBe('0,85');
    expect(result.progressPercent).toBeCloseTo(85.4);
  });

  it('classifies 0.50 <= R² < 0.75 as Aceitável (acceptable)', () => {
    const result = getQualityAssessment(0.6945);
    expect(result.level).toBe('acceptable');
    expect(result.badgeLabel).toBe('Aceitável');
    expect(result.badgeVariant).toBe('warning');
    expect(result.phrase).toBe(QUALITY_FOOTER_PHRASES.acceptable);
    expect(result.isAvailable).toBe(true);
    expect(result.valueFormatted).toBe('0,69');
    expect(result.progressPercent).toBeCloseTo(69.45);
  });

  it('classifies boundary R² = 0.50 as Aceitável', () => {
    const result = getQualityAssessment(0.50);
    expect(result.level).toBe('acceptable');
    expect(result.badgeLabel).toBe('Aceitável');
    expect(result.badgeVariant).toBe('warning');
  });

  it('classifies R² < 0.50 as Fraco (poor)', () => {
    const result = getQualityAssessment(0.42);
    expect(result.level).toBe('poor');
    expect(result.badgeLabel).toBe('Fraco');
    expect(result.badgeVariant).toBe('destructive');
    expect(result.phrase).toBe(QUALITY_FOOTER_PHRASES.poor);
    expect(result.isAvailable).toBe(true);
    expect(result.valueFormatted).toBe('0,42');
    expect(result.progressPercent).toBe(42);
  });

  it('handles negative R² as Fraco without breaking, showing "—" and hiding progress bar', () => {
    const result = getQualityAssessment(-0.15);
    expect(result.level).toBe('poor');
    expect(result.badgeLabel).toBe('Fraco');
    expect(result.badgeVariant).toBe('destructive');
    expect(result.phrase).toBe(QUALITY_FOOTER_PHRASES.poor);
    expect(result.isAvailable).toBe(false);
    expect(result.valueFormatted).toBe('—');
    expect(result.progressPercent).toBeNull();
  });

  it('handles null R² as Indisponível without breaking, showing "—" and hiding progress bar', () => {
    const result = getQualityAssessment(null);
    expect(result.level).toBe('unavailable');
    expect(result.badgeLabel).toBe('Indisponível');
    expect(result.badgeVariant).toBe('default');
    expect(result.phrase).toBe(QUALITY_FOOTER_PHRASES.unavailable);
    expect(result.isAvailable).toBe(false);
    expect(result.valueFormatted).toBe('—');
    expect(result.progressPercent).toBeNull();
  });

  it('handles undefined R² as Indisponível', () => {
    const result = getQualityAssessment(undefined);
    expect(result.level).toBe('unavailable');
    expect(result.badgeLabel).toBe('Indisponível');
    expect(result.isAvailable).toBe(false);
    expect(result.valueFormatted).toBe('—');
    expect(result.progressPercent).toBeNull();
  });
});

