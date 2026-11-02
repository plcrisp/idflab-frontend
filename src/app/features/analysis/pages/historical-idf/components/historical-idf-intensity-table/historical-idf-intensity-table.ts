import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { HistoricalIdfResponse } from '../../models/historical-idf.model';

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
  readonly mode = input<'intensity' | 'error'>('intensity');
  readonly distributionName = input<string>('');

  readonly maxAbsPct = computed<number>(() => {
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
    const max = this.maxAbsPct();
    const c1 = (max * 0.25).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const c2 = (max * 0.5).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const c3 = (max * 0.75).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return { c1, c2, c3 };
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

  getCellBgStyle(fraction: number): string {
    if (this.mode() !== 'error') return '';
    const absPct = Math.abs(fraction * 100);
    const max = this.maxAbsPct();
    let alpha = 8;
    if (absPct > 0.75 * max) {
      alpha = 44;
    } else if (absPct > 0.5 * max) {
      alpha = 30;
    } else if (absPct > 0.25 * max) {
      alpha = 18;
    }
    return `background-color: color-mix(in srgb, var(--primary) ${alpha}%, var(--card));`;
  }
}
