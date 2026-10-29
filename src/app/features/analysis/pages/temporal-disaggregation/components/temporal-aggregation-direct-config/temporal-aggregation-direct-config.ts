import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayers } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

@Component({
  selector: 'app-temporal-aggregation-direct-config',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButtonImports,
    HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideLayers,
    }),
  ],
  templateUrl: './temporal-aggregation-direct-config.html',
  styleUrl: './temporal-aggregation-direct-config.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalAggregationDirectConfig {
  readonly isExecuting = input<boolean>(false);
  readonly isExecuted = input<boolean>(false);
  readonly execute = output<void>();

  readonly compatibleDurations = [
    '10 min',
    '20 min',
    '30 min',
    '1 h',
    '6 h',
    '8 h',
    '10 h',
    '12 h',
    '24 h',
  ];
}

