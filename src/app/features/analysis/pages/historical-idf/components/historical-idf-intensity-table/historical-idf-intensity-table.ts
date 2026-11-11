import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { HistoricalIdfResponse } from '../../models/historical-idf.model';
import { ResultIdfBlock } from '../../../results/models/results.model';
import { getDistributionConfig } from '../../../distribution/constants/statistical-distribution.constants';

@Component({
  selector: 'app-historical-idf-intensity-table',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ...HlmTooltipImports],
  templateUrl: './historical-idf-intensity-table.html',
  styleUrl: './historical-idf-intensity-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalIdfIntensityTable {
  readonly data = input.required<HistoricalIdfResponse>();
  readonly historicalData = input<HistoricalIdfResponse | ResultIdfBlock | null>(null);
  readonly mode = input<'intensity' | 'quantiles' | 'error' | 'variation'>('intensity');
  readonly distributionName = input<string>('');
  readonly variationPct = input<Record<string, number[]> | null>(null);
  readonly historicalEquationMmH = input<Record<string, number[]> | null>(null);

  readonly distributionLabel = computed<string>(() => {
    const custom = this.distributionName();
    if (custom) return custom;
    const dist = this.data()?.distribution;
    if (!dist) return '';
    return getDistributionConfig(dist).name;
  });

  readonly maxAbsPct = computed<number>(() => {
    if (this.mode() === 'variation') {
      const v = this.variationPct();
      if (!v) return 5;
      let maxVal = 0;
      for (const row of Object.values(v)) {
        if (Array.isArray(row)) {
          for (const val of row) {
            const absVal = Math.abs(val);
            if (absVal > maxVal) maxVal = absVal;
          }
        }
      }
      return Math.max(maxVal, 1);
    }

    const d = this.data();
    if (!d?.relative_error) return 5;
    let maxVal = 0;
    for (const tr of d.return_periods ?? []) {
      const row = d.relative_error[String(tr)];
      if (Array.isArray(row)) {
        for (const val of row) {
          const absPct = Math.abs(val * 100);
          if (absPct > maxVal) maxVal = absPct;
        }
      }
    }
    return Math.max(maxVal, 1);
  });

  readonly heatmapCutoffs = computed(() => {
    if (this.mode() === 'variation') {
      const vals: number[] = [];
      const v = this.variationPct();
      if (v) {
        for (const row of Object.values(v)) {
          if (Array.isArray(row) && row.length > 0) {
            vals.push(Math.abs(row[0]));
          }
        }
      }
      vals.sort((a, b) => a - b);

      if (vals.length >= 4) {
        // Percentis 25%, 50% e 75% dos valores absolutos observados
        const getPercentile = (q: number): number => {
          const pos = (vals.length - 1) * q;
          const base = Math.floor(pos);
          const rest = pos - base;
          if (base + 1 < vals.length) {
            return vals[base] + rest * (vals[base + 1] - vals[base]);
          }
          return vals[base];
        };

        const p25 = Number(getPercentile(0.25).toFixed(1));
        const p50 = Number(getPercentile(0.5).toFixed(1));
        const p75 = Number(getPercentile(0.75).toFixed(1));

        const c1Val = p25;
        const c2Val = p50 > c1Val ? p50 : Number((c1Val + 0.1).toFixed(1));
        const c3Val = p75 > c2Val ? p75 : Number((c2Val + 0.1).toFixed(1));

        return {
          c1Val,
          c2Val,
          c3Val,
          c1: c1Val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          c2: c2Val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          c3: c3Val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        };
      }
    }

    const max = this.maxAbsPct();
    const c1Val = max * 0.25;
    const c2Val = max * 0.5;
    const c3Val = max * 0.75;
    return {
      c1Val,
      c2Val,
      c3Val,
      c1: c1Val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      c2: c2Val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      c3: c3Val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    };
  });

  isExtrapolated(tr: number): boolean {
    return (
      this.data().flags?.extrapolation?.extrapolated_return_periods?.includes(tr) ?? false
    );
  }

  formatSignedPercentage(fraction: number | null | undefined): string {
    if (fraction == null || Number.isNaN(fraction)) return '0,0%';
    const pct = fraction * 100;
    const sign = pct > 0.0001 ? '+' : pct < -0.0001 ? '−' : '';
    const absFmt = Math.abs(pct).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${absFmt}%`;
  }

  formatVariationPercentage(pct: number | null | undefined): string {
    if (pct == null || Number.isNaN(pct)) return '0,0%';
    const sign = pct > 0.049 ? '+' : pct < -0.049 ? '-' : '';
    const absFmt = Math.abs(pct).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${absFmt}%`;
  }

  formatQuantileDelta(
    hist: number | null | undefined,
    fut: number | null | undefined,
  ): string {
    if (hist == null || fut == null || hist === 0) return '—';
    const pct = ((fut - hist) / hist) * 100;
    const sign = pct > 0.049 ? '+' : pct < -0.049 ? '−' : '';
    const absFmt = Math.abs(pct).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${absFmt}%`;
  }

  getCellBgStyle(val: number | null | undefined): string {
    if (val == null || Number.isNaN(val)) return '';
    if (this.mode() !== 'error' && this.mode() !== 'variation') return '';
    const absPct = this.mode() === 'error' ? Math.abs(val * 100) : Math.abs(val);
    const cutoffs = this.heatmapCutoffs();
    let alpha = 8;
    if (absPct >= cutoffs.c3Val) {
      alpha = 44;
    } else if (absPct >= cutoffs.c2Val) {
      alpha = 30;
    } else if (absPct >= cutoffs.c1Val) {
      alpha = 18;
    }
    return `background-color: color-mix(in srgb, var(--primary) ${alpha}%, var(--card));`;
  }
}
