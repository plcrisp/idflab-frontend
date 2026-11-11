import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideCheck,
  lucidePercent,
  lucideTrendingUp,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';

import { BiasCorrectionMethod } from '../../models/future-scenarios.model';
import { Path } from '../../../../shared/components/path/path';

export interface BiasMethodOption {
  value: BiasCorrectionMethod;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-future-scenarios-method-selector',
  standalone: true,
  imports: [CommonModule, HlmBadge, Path],
  providers: [
    provideIcons({
      lucideTrendingUp,
      lucideChartColumn,
      lucidePercent,
      lucideCheck,
    }),
  ],
  templateUrl: './future-scenarios-method-selector.html',
  styleUrl: './future-scenarios-method-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class FutureScenariosMethodSelector {
  readonly selected = model<BiasCorrectionMethod | null>('EQM');
  readonly appliedMethod = input<BiasCorrectionMethod | null>(null);
  readonly disabled = input<boolean>(false);

  readonly methodChange = output<BiasCorrectionMethod>();

  readonly methodOptions: readonly BiasMethodOption[] = [
    {
      value: 'EQM',
      title: 'Equidistant Quantile Mapping (EQM)',
      description:
        'Preserva o sinal de mudança climática em cada quantil.',
      icon: 'lucideTrendingUp',
    },
    {
      value: 'QM',
      title: 'Quantil Mapping (QM)',
      description:
        'Alinha a distribuição do modelo à observada.',
      icon: 'lucideChartColumn',
    },
    {
      value: 'DBC',
      title: 'Daily Bias Correction (DBC)',
      description:
        'Corrige percentil a percentil, com menor custo operacional.',
      icon: 'lucidePercent',
    },
  ];

  selectMethod(method: BiasCorrectionMethod): void {
    if (this.disabled()) return;
    this.selected.set(method);
    this.methodChange.emit(method);
  }
}

