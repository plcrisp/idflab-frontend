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
  badge: string;
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
      title: 'EQM',
      badge: 'Recomendado',
      description:
        'Preserva o sinal de mudança climática ao ajustar os quantis empíricos do modelo aos dados observados.',
      icon: 'lucideTrendingUp',
    },
    {
      value: 'QM',
      title: 'QM',
      badge: 'Clássico',
      description:
        'Ajusta diretamente a distribuição acumulada do modelo futuro à distribuição observada na referência.',
      icon: 'lucideChartColumn',
    },
    {
      value: 'DBC',
      title: 'DBC',
      badge: 'Rápido',
      description:
        'Corrige percentil a percentil com menor custo computacional, mantendo a consistência dos extremos.',
      icon: 'lucidePercent',
    },
  ];

  selectMethod(method: BiasCorrectionMethod): void {
    if (this.disabled()) return;
    this.selected.set(method);
    this.methodChange.emit(method);
  }
}

