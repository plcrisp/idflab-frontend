import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideChartColumn,
  lucideGlobe,
  lucidePercent,
  lucideTrendingUp,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import {
  HistoricalIdfFlags,
  HistoricalIdfResponse,
} from '../../models/historical-idf.model';
import { ResultIdfBlock } from '../../../results/models/results.model';
import {
  CLIMATE_MODEL_CONFIGS,
  ClimateModel,
  FutureScenariosAppliedParams,
} from '../../../future-scenarios/models/future-scenarios.model';

@Component({
  selector: 'app-historical-idf-equation-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, NgIcon, ...HlmTooltipImports],
  providers: [
    provideIcons({
      lucideTriangleAlert,
      lucideGlobe,
      lucideCalendar,
      lucideTrendingUp,
      lucideChartColumn,
      lucidePercent,
    }),
  ],
  templateUrl: './historical-idf-equation-card.html',
  styleUrl: './historical-idf-equation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalIdfEquationCard {
  readonly data = input.required<HistoricalIdfResponse | ResultIdfBlock>();
  readonly futureData = input<ResultIdfBlock | null>(null);
  readonly appliedParams = input<FutureScenariosAppliedParams | null>(null);
  readonly distributionName = input<string>('');
  readonly distributionColor = input<string>('');
  readonly configSubtitle = input<string>('');

  readonly modelColor = computed<string>(() => {
    const m = this.appliedParams()?.model;
    if (!m) return '#3b82f6';
    return CLIMATE_MODEL_CONFIGS[m as ClimateModel]?.color ?? '#3b82f6';
  });

  readonly methodIcon = computed<string>(() => {
    const method = this.appliedParams()?.method;
    if (method === 'QM') return 'lucideChartColumn';
    if (method === 'DBC') return 'lucidePercent';
    return 'lucideTrendingUp';
  });

  readonly sspLabel = computed<string>(() => {
    const ssp = this.appliedParams()?.ssp;
    if (ssp === 'SSP585') return 'SSP5-8.5';
    if (ssp === 'SSP245') return 'SSP2-4.5';
    return ssp ?? '';
  });

  readonly periodLabel = computed<string>(() => {
    const p = this.appliedParams()?.period;
    if (!p) return '';
    return p.replace('-', '–');
  });

  formatDeltaPct(base: number | null | undefined, target: number | null | undefined): string {
    if (base == null || target == null || base === 0) return '0,0%';
    const pct = ((target - base) / base) * 100;
    if (Math.abs(pct) < 0.05) return '0,0%';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  }

  getT0Tooltip(flags?: HistoricalIdfFlags): string {
    if (flags?.t0_bound?.at_bound) {
      const boundType =
        flags.t0_bound.bound === 'lower'
          ? 'inferior (0,1 min)'
          : 'superior (10,0 min)';
      return `Parâmetro t₀ atingiu o limite ${boundType} do intervalo [0,1; 10,0] min`;
    }
    return 'Parâmetro t₀ somado à duração em minutos';
  }

  formatAbsErrorPercentage(fraction: number | null | undefined): string {
    if (fraction == null || Number.isNaN(fraction)) return '0,0%';
    const absPct = Math.abs(fraction * 100);
    return `${absPct.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  }
}
