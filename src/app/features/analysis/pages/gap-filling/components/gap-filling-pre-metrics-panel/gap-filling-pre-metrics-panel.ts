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
  lucideCalendar,
  lucideChevronDown,
  lucideChevronUp,
  lucideInfo,
  lucideRotateCw,
  lucideShieldCheck,
  lucideSparkles,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideWrench,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { SharedModule } from '../../../../../../shared/shared-module';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import {
  GapFillingPreMetrics,
  GapFillingWarning,
  ProcessedWarning,
  ReliabilityBadge,
} from '../../models/gap-filling-pre-metrics.model';
import {
  MAX_VISIBLE_WARNINGS,
  METRIC_TOOLTIPS,
} from '../../constants/gap-filling-pre-metrics.constants';
import { getReliabilityBadge } from '../../utils/gap-filling-reliability.utils';
import { mapGapFillingWarnings } from '../../utils/gap-filling-warnings.utils';

@Component({
  selector: 'app-gap-filling-pre-metrics-panel',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    SharedModule,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmProgressImports,
    ...HlmSkeletonImports,
    ...HlmTooltipImports,
    ...HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideArrowRight,
      lucideCalendar,
      lucideChevronDown,
      lucideChevronUp,
      lucideInfo,
      lucideRotateCw,
      lucideShieldCheck,
      lucideSparkles,
      lucideTrendingUp,
      lucideTriangleAlert,
      lucideWrench,
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
  readonly isFilling = input<boolean>(false);
  readonly isFilled = input<boolean>(false);

  readonly retry = output<void>();
  readonly fillGaps = output<void>();
  readonly skipStep = output<void>();

  readonly showAllWarnings = signal<boolean>(false);
  readonly showTechnicalDetails = signal<boolean>(false);
  readonly metricTooltips = METRIC_TOOLTIPS;

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
    if (this.showAllWarnings() || all.length <= MAX_VISIBLE_WARNINGS) {
      return all;
    }
    return all.slice(0, MAX_VISIBLE_WARNINGS);
  });

  readonly hiddenWarningsCount = computed<number>(() => {
    const total = this.processedWarnings().length;
    return Math.max(0, total - MAX_VISIBLE_WARNINGS);
  });

  readonly reliabilityBadge = computed<ReliabilityBadge | null>(() => {
    if (this.hasNoOverlap()) {
      return null;
    }
    const m = this.metrics();
    return getReliabilityBadge(m?.pearson_r, m?.overlap_years);
  });

  readonly hasNoFillableGaps = computed<boolean>(() => {
    const m = this.metrics();
    return m != null && (m.fillable_gaps ?? 0) <= 0;
  });

  readonly isFillButtonDisabled = computed<boolean>(() => {
    return (
      this.loading() ||
      this.isFilling() ||
      !!this.error() ||
      !this.metrics() ||
      this.hasNoOverlap() ||
      this.hasNoGaps() ||
      this.hasNoFillableGaps() ||
      this.disabled()
    );
  });

  readonly fillButtonText = computed<string>(() => {
    if (this.hasNoFillableGaps()) {
      return 'Nenhuma falha preenchível';
    }
    const station = this.neighborStation();
    if (!station?.name) {
      return 'Preencher falhas com a estação selecionada';
    }
    const formatted = new TitleCasePipe().transform(station.name) || station.name;
    return `Preencher falhas com ${formatted}`;
  });

  toggleWarningsExpanded(): void {
    this.showAllWarnings.update((v) => !v);
  }

  toggleTechnicalDetails(): void {
    this.showTechnicalDetails.update((v) => !v);
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
      return '—';
    }
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatInteger(val: number | null | undefined): string {
    if (val == null || Number.isNaN(val) || this.hasNoOverlap()) {
      return '—';
    }
    return val.toLocaleString('pt-BR');
  }
}
