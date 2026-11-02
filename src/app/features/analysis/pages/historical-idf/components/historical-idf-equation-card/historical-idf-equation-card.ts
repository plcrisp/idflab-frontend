import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { lucideTriangleAlert } from '@ng-icons/lucide';
import { provideIcons } from '@ng-icons/core';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import {
  HistoricalIdfFlags,
  HistoricalIdfResponse,
} from '../../models/historical-idf.model';

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
  readonly data = input.required<HistoricalIdfResponse>();
  readonly distributionName = input<string>('');
  readonly distributionColor = input<string>('');

  getThetaTooltip(flags?: HistoricalIdfFlags): string {
    if (flags?.theta_bound?.at_bound) {
      const boundType =
        flags.theta_bound.bound === 'lower'
          ? 'inferior (0,1 min)'
          : 'superior (10,0 min)';
      return `Parâmetro θ atingiu o limite ${boundType} do intervalo [0,1; 10,0] min`;
    }
    return 'Duração de referência da bacia (θ) em minutos';
  }
}

