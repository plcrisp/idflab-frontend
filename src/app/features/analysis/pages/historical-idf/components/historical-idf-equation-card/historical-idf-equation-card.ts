import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import {
  HistoricalIdfFlags,
  HistoricalIdfResponse,
} from '../../models/historical-idf.model';
import { ResultIdfBlock } from '../../../results/models/results.model';

@Component({
  selector: 'app-historical-idf-equation-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, NgIcon, ...HlmTooltipImports],
  providers: [provideIcons({ lucideTriangleAlert })],
  templateUrl: './historical-idf-equation-card.html',
  styleUrl: './historical-idf-equation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalIdfEquationCard {
  readonly data = input.required<HistoricalIdfResponse | ResultIdfBlock>();
  readonly futureData = input<ResultIdfBlock | null>(null);
  readonly distributionName = input<string>('');
  readonly distributionColor = input<string>('');
  readonly configSubtitle = input<string>('');

  getT0Tooltip(flags?: HistoricalIdfFlags): string {
    if (flags?.t0_bound?.at_bound) {
      const boundType =
        flags.t0_bound.bound === 'lower'
          ? 'inferior (0,1 min)'
          : 'superior (10,0 min)';
      return `Parâmetro t₀ atingiu o limite ${boundType} do intervalo [0,1; 10,0] min`;
    }
    return 'Parâmetro t₀ (θ) somado à duração em minutos';
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
