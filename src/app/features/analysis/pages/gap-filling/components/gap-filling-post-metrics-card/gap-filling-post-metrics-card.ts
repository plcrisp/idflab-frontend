import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCalendar,
  lucideCpu,
  lucideGauge,
  lucideMapPin,
  lucideRotateCw,
  lucideShieldCheck,
  lucideSparkles,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { SharedModule } from '../../../../../../shared/shared-module';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { Job } from '../../../../../../core/models/api/job.model';
import { GapFillingPostMetrics } from '../../models/gap-filling.model';

@Component({
  selector: 'app-gap-filling-post-metrics-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    NgIcon,
    SharedModule,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCalendar,
      lucideCpu,
      lucideGauge,
      lucideMapPin,
      lucideRotateCw,
      lucideShieldCheck,
      lucideSparkles,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './gap-filling-post-metrics-card.html',
  styleUrl: './gap-filling-post-metrics-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GapFillingPostMetricsCard {
  readonly isFilling = input<boolean>(false);
  readonly job = input<Job | null>(null);
  readonly metrics = input<GapFillingPostMetrics | null>(null);
  readonly station = input<NeighborStation | null>(null);
  readonly totalYears = input<number | null>(null);
  readonly disabled = input<boolean>(false);

  readonly recalculate = output<void>();

  readonly normalizedMetrics = computed(() => {
    const m = this.metrics();
    if (!m) return null;
    return {
      filled_count: m.filled_count ?? (m as any).filledCount,
      remaining_gaps_pct: m.remaining_gaps_pct ?? (m as any).remainingGapsPct,
      complete_years_after: m.complete_years_after ?? (m as any).completeYearsAfter,
      model_score_r2: m.model_score_r2 ?? (m as any).modelScoreR2,
      model_rmse: m.model_rmse ?? (m as any).modelRmse,
      model_mae: m.model_mae ?? (m as any).modelMae,
    };
  });

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }

  formatDecimal(val: number | null | undefined, decimals = 2): string {
    if (val == null || Number.isNaN(val)) return '—';
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatInteger(val: number | null | undefined): string {
    if (val == null || Number.isNaN(val)) return '—';
    return val.toLocaleString('pt-BR');
  }
}
