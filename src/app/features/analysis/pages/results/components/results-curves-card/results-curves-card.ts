import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucidePercent,
  lucideTable,
  lucideTrendingDown,
} from '@ng-icons/lucide';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { toast } from '@spartan-ng/brain/sonner';

import { ResultsResponse } from '../../models/results.model';
import { HistoricalIdfResponse } from '../../../historical-idf/models/historical-idf.model';
import { HistoricalIdfChart } from '../../../historical-idf/components/historical-idf-chart/historical-idf-chart';
import { HistoricalIdfIntensityTable } from '../../../historical-idf/components/historical-idf-intensity-table/historical-idf-intensity-table';
import { getHistoricalIdfTrColor } from '../../../historical-idf/constants/historical-idf.constants';

@Component({
  selector: 'app-results-curves-card',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HistoricalIdfChart,
    HistoricalIdfIntensityTable,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideTrendingDown,
      lucideTable,
      lucidePercent,
      lucideCheck,
    }),
  ],
  templateUrl: './results-curves-card.html',
  styleUrl: './results-curves-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class ResultsCurvesCard {
  readonly resultsData = input<ResultsResponse | null>(null);
  readonly loading = input<boolean>(false);

  readonly activeView = signal<'curves' | 'intensity' | 'variation'>('curves');
  readonly chartScale = signal<'log' | 'linear'>('linear');
  readonly selectedTrs = signal<number[]>([2, 25, 100]);

  isSelected(tr: number): boolean {
    return this.selectedTrs().includes(tr);
  }

  toggleTr(tr: number): void {
    const current = this.selectedTrs();
    if (current.includes(tr)) {
      if (current.length === 1) {
        toast.info('Selecione ao menos um tempo de retorno para visualização.');
        return;
      }
      this.selectedTrs.set(current.filter((t) => t !== tr));
    } else {
      this.selectedTrs.set([...current, tr].sort((a, b) => a - b));
    }
  }

  getTrColor(tr: number): string {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return getHistoricalIdfTrColor(tr, isLight);
  }

  readonly historicalChartData = computed<HistoricalIdfResponse | null>(() => {
    const d = this.resultsData();
    if (!d) return null;
    return {
      project_id: d.project_id,
      step_id: d.step_id,
      status: 'COMPLETED',
      distribution: d.distribution,
      return_periods: d.return_periods,
      durations: d.durations,
      k: d.historical_idf.k,
      m: d.historical_idf.m,
      n: d.historical_idf.n,
      t0: d.historical_idf.t0,
      r2: d.historical_idf.r2,
      max_error: d.historical_idf.max_error,
      quantiles_mm_h: d.historical_idf.quantiles_mm_h,
      equation_mm_h: d.historical_idf.equation_mm_h,
      relative_error: d.historical_idf.relative_error,
      flags: d.historical_idf.flags,
      library_versions: {},
      dense_grid: d.historical_dense_grid,
    };
  });

  readonly futureTableData = computed<HistoricalIdfResponse | null>(() => {
    const d = this.resultsData();
    if (!d) return null;
    return {
      project_id: d.project_id,
      step_id: d.step_id,
      status: 'COMPLETED',
      distribution: d.distribution,
      return_periods: d.return_periods,
      durations: d.durations,
      k: d.future_idf.k,
      m: d.future_idf.m,
      n: d.future_idf.n,
      t0: d.future_idf.t0,
      r2: d.future_idf.r2,
      max_error: d.future_idf.max_error,
      quantiles_mm_h: d.future_idf.quantiles_mm_h,
      equation_mm_h: d.intensity_table_mm_h ?? d.future_idf.equation_mm_h,
      relative_error: d.future_idf.relative_error,
      flags: d.future_idf.flags,
      library_versions: {},
      dense_grid: d.future_dense_grid,
    };
  });
}

