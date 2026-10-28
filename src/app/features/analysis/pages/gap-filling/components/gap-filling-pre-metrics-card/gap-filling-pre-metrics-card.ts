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
  lucideArrowUp,
  lucideCalendar,
  lucideChevronDown,
  lucideChevronUp,
  lucideInfo,
  lucideMapPin,
  lucideRotateCw,
  lucideScale,
  lucideShieldCheck,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideWrench,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { SharedModule } from '../../../../../../shared/shared-module';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import { ConfirmationStatus, NeighborProgressInfo } from '../../../../shared/models/analysis.models';
import {
  GapFillingPreMetrics,
  GapFillingWarning,
  ProcessedWarning,
  ReliabilityBadge,
} from '../../models/gap-filling-pre-metrics.model';
import {
  MAX_VISIBLE_WARNINGS,
  getAccumulatedRatioBadge,
  getReliabilityBadge,
  mapGapFillingWarnings,
} from '../../constants/gap-filling-pre-metrics.constants';

@Component({
  selector: 'app-gap-filling-pre-metrics-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    NgIcon,
    SharedModule,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmProgressImports,
    ...HlmSkeletonImports,
    ...HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideArrowRight,
      lucideArrowUp,
      lucideCalendar,
      lucideChevronDown,
      lucideChevronUp,
      lucideInfo,
      lucideMapPin,
      lucideRotateCw,
      lucideScale,
      lucideShieldCheck,
      lucideTrendingUp,
      lucideTriangleAlert,
      lucideWrench,
    }),
  ],
  templateUrl: './gap-filling-pre-metrics-card.html',
  styleUrl: './gap-filling-pre-metrics-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GapFillingPreMetricsCard {
  readonly activeStation = input<NeighborStation | null>(null);
  readonly selectedStation = input<NeighborStation | null>(null);
  readonly status = input<ConfirmationStatus>('idle');
  readonly job = input<ActiveJobItem | null>(null);
  readonly progress = input<NeighborProgressInfo | null>(null);
  readonly metrics = input<GapFillingPreMetrics | null>(null);
  readonly warnings = input<(string | GapFillingWarning)[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly disabled = input<boolean>(false);
  readonly isFilling = input<boolean>(false);
  readonly isFilled = input<boolean>(false);

  readonly changeStation = output<void>();
  readonly retry = output<void>();
  readonly fillGaps = output<void>();
  readonly skipStep = output<void>();

  readonly showAllWarnings = signal<boolean>(false);

  readonly targetStation = computed<NeighborStation | null>(() => {
    if (this.status() === 'loading') {
      return this.selectedStation() ?? this.activeStation();
    }
    return this.activeStation();
  });

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

  readonly accumulatedRatioBadge = computed<ReliabilityBadge | null>(() => {
    if (this.hasNoOverlap()) {
      return null;
    }
    return getAccumulatedRatioBadge(this.metrics()?.accumulated_ratio);
  });

  readonly pearsonFooterText = computed<string>(() => {
    const mode = this.metrics()?.mode;
    return mode === 'hourly'
      ? 'Associação linear horária entre as séries'
      : 'Associação linear diária entre as séries';
  });

  readonly commonPeriodFooterText = computed<string>(() => {
    const m = this.metrics();
    if (!m) return '';
    if (m.mode === 'hourly') {
      const approxDays = Math.round(m.valid_pairs / 24);
      return `${this.formatInteger(m.valid_pairs)} horas simultâneas com a vizinha (~${this.formatInteger(approxDays)} dias)`;
    }
    return `${this.formatInteger(m.valid_pairs)} dias simultâneos com a vizinha`;
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
    const station = this.targetStation();
    if (!station?.name) {
      return 'Preencher falhas com a estação selecionada';
    }
    const formatted = new TitleCasePipe().transform(station.name) || station.name;
    return `Preencher falhas com ${formatted}`;
  });

  toggleWarningsExpanded(): void {
    this.showAllWarnings.update((v) => !v);
  }

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
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
