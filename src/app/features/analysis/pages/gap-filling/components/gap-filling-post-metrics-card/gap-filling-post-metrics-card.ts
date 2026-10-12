import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
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
import { HlmDateRangePicker } from '@spartan-ng/helm/date-picker';

import { SharedModule } from '../../../../../../shared/shared-module';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { Job } from '../../../../../../core/models/api/job.model';
import {
  GapFillingPostMetrics,
  GapFillingVisualizationResponse,
} from '../../models/gap-filling.model';
import { GapFillingService } from '../../../../services/gap-filling.service';
import { TimeSeriesDetailChart } from '../../../initial-visualization/components/time-series-detail-chart/time-series-detail-chart';

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
    HlmDateRangePicker,
    TimeSeriesDetailChart,
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
  private readonly gapFillingService = inject(GapFillingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input<string | null>(null);
  readonly isFilling = input<boolean>(false);
  readonly job = input<Job | null>(null);
  readonly metrics = input<GapFillingPostMetrics | null>(null);
  readonly station = input<NeighborStation | null>(null);
  readonly totalYears = input<number | null>(null);
  readonly disabled = input<boolean>(false);

  readonly recalculate = output<void>();

  readonly visualization = signal<GapFillingVisualizationResponse | null>(null);
  readonly isLoadingVisualization = signal<boolean>(false);
  private visualizationSub: Subscription | null = null;
  private lastLoadedProjectId: string | null = null;

  readonly detailMockBars = [
    0, 15, 45, 0, 0, 10, 28, 0, 0, 0, 38, 82, 14, 0, 0, 0, 8, 24, 0, 0, 68, 94,
    32, 0, 0, 0, 20, 48, 0, 0, 12, 30, 58, 0, 0, 0, 42, 86, 22, 0, 0, 0, 16,
    36, 0, 0, 0, 52, 74, 28, 0, 0, 18, 42, 0, 0, 0, 32, 64, 15, 0,
  ];

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.visualizationSub?.unsubscribe();
    });

    effect(() => {
      const pid = this.projectId();
      const m = this.normalizedMetrics();
      const filling = this.isFilling();

      if (!pid || !m || filling) {
        if (!filling && !m) {
          untracked(() => this.visualization.set(null));
        }
        return;
      }

      untracked(() => {
        if (this.lastLoadedProjectId !== pid) {
          this.lastLoadedProjectId = pid;
          this.loadVisualization();
        }
      });
    });
  }

  loadVisualization(start?: string, end?: string): void {
    const pid = this.projectId();
    if (!pid) return;

    this.isLoadingVisualization.set(true);
    this.visualizationSub?.unsubscribe();

    const params: { start?: string; end?: string } = {};
    if (start) params.start = start;
    if (end) params.end = end;

    this.visualizationSub = this.gapFillingService.getVisualization(pid, params).subscribe({
      next: (res) => {
        this.visualization.set(res);
        this.isLoadingVisualization.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar visualização de gap filling:', err);
        this.isLoadingVisualization.set(false);
      },
    });
  }

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

  readonly correctionsInWindow = computed(
    () => this.visualization()?.total_corrections_in_window ?? 0,
  );

  readonly minDate = computed<Date | undefined>(() => {
    const yearly = this.visualization()?.yearly_corrections;
    if (!yearly || !yearly.length) return undefined;
    const minYear = Math.min(...yearly.map((y) => y.year));
    return new Date(minYear, 0, 1);
  });

  readonly maxDate = computed<Date | undefined>(() => {
    const yearly = this.visualization()?.yearly_corrections;
    if (!yearly || !yearly.length) return undefined;
    const maxYear = Math.max(...yearly.map((y) => y.year));
    return new Date(maxYear, 11, 31);
  });

  readonly pickerDate = computed<[Date, Date] | undefined>(() => {
    const win = this.visualization()?.applied_window;
    if (!win?.start || !win?.end) return undefined;

    const parseLocalDate = (s: string): Date => {
      const parts = s.slice(0, 10).split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      return new Date(y, m, d);
    };

    return [parseLocalDate(win.start), parseLocalDate(win.end)];
  });

  readonly formatDates = (dates: [Date | undefined, Date | undefined]): string => {
    const [start, end] = dates;
    const fmt = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    if (start && end) return `${fmt(start)} - ${fmt(end)}`;
    if (start) return `${fmt(start)} - ...`;
    return '';
  };

  onDateRangeChange(dates: [Date, Date] | null): void {
    if (!dates || !dates[0] || !dates[1]) return;
    let [start, end] = dates;

    if (start.getTime() > end.getTime()) {
      const temp = start;
      start = end;
      end = temp;
    }

    const MAX_SPAN_MS = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > MAX_SPAN_MS) {
      end = new Date(start.getTime() + MAX_SPAN_MS);
    }

    const toIso = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    this.loadVisualization(toIso(start), toIso(end));
  }

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
