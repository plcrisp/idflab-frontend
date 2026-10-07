import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideArrowRight,
  lucideChevronDown,
  lucideChevronUp,
  lucideInfo,
  lucideRotateCw,
  lucideShieldCheck,
  lucideSparkles,
  lucideTrendingUp,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { NeighborStation } from '../../../../../../core/models/api/station.model';
import {
  GapFillingPreMetrics,
  GapFillingWarning,
  ProcessedWarning,
  ReliabilityBadge,
} from '../../models/gap-filling-pre-metrics.model';
import { GAP_FILLING_I18N } from '../../constants/gap-filling-pre-metrics.constants';
import { getReliabilityBadge } from '../../utils/gap-filling-reliability.utils';
import { mapGapFillingWarnings } from '../../utils/gap-filling-warnings.utils';

@Component({
  selector: 'app-gap-filling-pre-metrics-panel',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmProgressImports,
    ...HlmSkeletonImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideArrowRight,
      lucideChevronDown,
      lucideChevronUp,
      lucideInfo,
      lucideRotateCw,
      lucideShieldCheck,
      lucideSparkles,
      lucideTrendingUp,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './gap-filling-pre-metrics-panel.html',
  styleUrl: './gap-filling-pre-metrics-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GapFillingPreMetricsPanel {
  readonly metrics = input<GapFillingPreMetrics | null>(null);
  readonly warnings = input<(string | GapFillingWarning)[]>([]);
  readonly neighborStation = input<NeighborStation | null>(null);
  readonly totalYears = input<number | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  readonly retry = output<void>();
  readonly fillGaps = output<void>();
  readonly skipStep = output<void>();

  readonly showAllWarnings = signal<boolean>(false);
  readonly i18n = GAP_FILLING_I18N;

  readonly processedWarnings = computed<ProcessedWarning[]>(() => {
    return mapGapFillingWarnings(this.warnings(), {
      longestGapDays: this.metrics()?.longest_gap_days,
    });
  });

  readonly hasNoOverlap = computed<boolean>(() => {
    return this.warnings()?.includes('NO_OVERLAP') ?? false;
  });

  readonly hasNoGaps = computed<boolean>(() => {
    return this.warnings()?.includes('NO_GAPS') ?? false;
  });

  readonly visibleWarnings = computed<ProcessedWarning[]>(() => {
    const all = this.processedWarnings();
    if (this.showAllWarnings() || all.length <= GAP_FILLING_I18N.maxVisibleWarnings) {
      return all;
    }
    return all.slice(0, GAP_FILLING_I18N.maxVisibleWarnings);
  });

  readonly hiddenWarningsCount = computed<number>(() => {
    const total = this.processedWarnings().length;
    return Math.max(0, total - GAP_FILLING_I18N.maxVisibleWarnings);
  });

  readonly reliabilityBadge = computed<ReliabilityBadge | null>(() => {
    if (this.hasNoOverlap()) {
      return null;
    }
    const m = this.metrics();
    return getReliabilityBadge(m?.pearson_r, m?.overlap_years);
  });

  readonly yearsGain = computed<number>(() => {
    const m = this.metrics();
    if (!m) return 0;
    return (m.complete_years_predicted ?? 0) - (m.complete_years_before ?? 0);
  });

  readonly hasYearsGain = computed<boolean>(() => {
    return !this.hasNoOverlap() && this.yearsGain() > 0;
  });

  readonly isFillButtonDisabled = computed<boolean>(() => {
    return (
      this.loading() ||
      !!this.error() ||
      !this.metrics() ||
      this.hasNoOverlap() ||
      this.hasNoGaps() ||
      this.disabled()
    );
  });

  readonly fillButtonText = computed<string>(() => {
    const station = this.neighborStation();
    if (!station?.name) {
      return GAP_FILLING_I18N.actions.fillGapsFallback;
    }
    const formatted = new TitleCasePipe().transform(station.name) || station.name;
    return `${GAP_FILLING_I18N.actions.fillGapsPrefix} ${formatted}`;
  });

  toggleWarningsExpanded(): void {
    this.showAllWarnings.update((v) => !v);
  }

  onRetry(): void {
    this.retry.emit();
  }

  onFillGaps(): void {
    if (this.isFillButtonDisabled()) return;
    this.fillGaps.emit();
  }

  onSkipStep(): void {
    this.skipStep.emit();
  }

  formatDecimal(val: number | null | undefined, decimals = 2): string {
    if (val == null || Number.isNaN(val) || this.hasNoOverlap()) {
      return GAP_FILLING_I18N.messages.noOverlapMetricPlaceholder;
    }
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatInteger(val: number | null | undefined): string {
    if (val == null || Number.isNaN(val) || this.hasNoOverlap()) {
      return GAP_FILLING_I18N.messages.noOverlapMetricPlaceholder;
    }
    return val.toLocaleString('pt-BR');
  }
}
