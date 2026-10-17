import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideChartColumn, lucideDroplet } from '@ng-icons/lucide';
import { Path } from '../../../../shared/components/path/path';

export type DisaggregationMethod = 'cetesb' | 'bartlett-lewis';

@Component({
  selector: 'app-temporal-disaggregation-path-selector',
  standalone: true,
  imports: [CommonModule, Path],
  providers: [
    provideIcons({
      lucideChartColumn,
      lucideDroplet,
    }),
  ],
  templateUrl: './temporal-disaggregation-path-selector.html',
  styleUrl: './temporal-disaggregation-path-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalDisaggregationPathSelector {
  readonly selected = model<DisaggregationMethod>('cetesb');
  readonly disabled = input<boolean>(false);

  selectOption(option: DisaggregationMethod): void {
    if (this.disabled()) return;
    this.selected.set(option);
  }
}
