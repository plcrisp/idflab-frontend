import { Component, computed, input } from '@angular/core';
import { StatCardFooter, StatCardSemanticVariant } from '../../../features/analysis/shared/models/analysis.models';

@Component({
  selector: 'app-stat-card',
  standalone: false,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  host: {
    '[class.h-full]': "layout() === 'default'",
    '[class.w-full]': 'true',
    '[class.block]': 'true',
  },
})
export class StatCard {
  label = input<string>('');
  icon = input<string>('');
  value = input<string | number | null | undefined>(null);
  unit = input<string | null | undefined>(undefined);
  footer = input<StatCardFooter>(null);
  loading = input<boolean>(false);
  muted = input<boolean>(false);
  variant = input<'card' | 'plain'>('card');
  layout = input<'default' | 'wide'>('default');
  iconVariant = input<StatCardSemanticVariant>('default');

  readonly progressPercent = computed<number>(() => {
    const f = this.footer();
    if (f?.type !== 'progress' || !f.max) {
      return 0;
    }
    return Math.min(100, Math.max(0, (f.value / f.max) * 100));
  });

  readonly progressVariant = computed<StatCardSemanticVariant>(() => {
    const f = this.footer();
    if (f?.type !== 'progress' || !f.variant) return 'default';
    return f.variant;
  });

  readonly progressIndicatorClass = computed<string>(() => {
    const v = this.progressVariant();
    if (v === 'success') return 'indicator-success !bg-success';
    if (v === 'warning') return 'indicator-warning !bg-warning';
    if (v === 'destructive') return 'indicator-destructive !bg-destructive';
    return '';
  });

  readonly progressColorStyle = computed<string | null>(() => {
    const v = this.progressVariant();
    if (v === 'success') return 'var(--success)';
    if (v === 'warning') return 'var(--warning)';
    if (v === 'destructive') return 'var(--destructive)';
    return null;
  });

  readonly iconContainerStyle = computed(() => {
    const v = this.iconVariant();
    if (v === 'success') {
      return {
        color: 'var(--success)',
        backgroundColor: 'color-mix(in srgb, var(--success) 14%, transparent)',
      };
    }
    if (v === 'warning') {
      return {
        color: 'var(--warning)',
        backgroundColor: 'color-mix(in srgb, var(--warning) 14%, transparent)',
      };
    }
    if (v === 'destructive') {
      return {
        color: 'var(--destructive)',
        backgroundColor: 'color-mix(in srgb, var(--destructive) 14%, transparent)',
      };
    }
    return {
      color: 'var(--primary)',
      backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    };
  });

  readonly footerLabelStyle = computed(() => {
    const f = this.footer();
    if (f?.type !== 'progress' || !f.variant) return { color: 'var(--foreground)' };
    const v = f.variant;
    if (v === 'success') return { color: 'var(--success)' };
    if (v === 'warning') return { color: 'var(--warning)' };
    if (v === 'destructive') return { color: 'var(--destructive)' };
    return { color: 'var(--foreground)' };
  });

  readonly footerBadgeStyle = computed(() => {
    const v = this.progressVariant();
    if (v === 'success') {
      return {
        color: 'var(--success)',
        backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--success) 24%, transparent)',
      };
    }
    if (v === 'warning') {
      return {
        color: 'var(--warning)',
        backgroundColor: 'color-mix(in srgb, var(--warning) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warning) 24%, transparent)',
      };
    }
    if (v === 'destructive') {
      return {
        color: 'var(--destructive)',
        backgroundColor: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--destructive) 24%, transparent)',
      };
    }
    return {
      color: 'var(--muted-foreground)',
      backgroundColor: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
    };
  });
}
