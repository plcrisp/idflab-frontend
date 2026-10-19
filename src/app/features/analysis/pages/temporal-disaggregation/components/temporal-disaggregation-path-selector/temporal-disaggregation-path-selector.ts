import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideChartColumn, lucideDroplet, lucideDroplets } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { Path } from '../../../../shared/components/path/path';

export type DisaggregationMethod = 'cetesb' | 'bartlett-lewis';

@Component({
  selector: 'app-temporal-disaggregation-path-selector',
  standalone: true,
  imports: [CommonModule, HlmBadge, Path],
  providers: [
    provideIcons({
      lucideChartColumn,
      lucideDroplet,
      lucideDroplets,
    }),
  ],
  templateUrl: './temporal-disaggregation-path-selector.html',
  styleUrl: './temporal-disaggregation-path-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalDisaggregationPathSelector {
  readonly selected = model<DisaggregationMethod>('cetesb');
  readonly disabled = input<boolean>(false);
  readonly bartlettDisabled = input<boolean>(false);
  readonly isCheckingCandidates = input<boolean>(false);
  readonly cetesbExecuted = input<boolean>(false);
  readonly bartlettExecuted = input<boolean>(false);

  readonly bartlettBadge = computed<string>(() => {
    if (this.isCheckingCandidates()) {
      return 'Buscando estações…';
    }
    if (this.bartlettDisabled()) {
      return 'Sem CEMADEN próxima';
    }
    return 'Avançado';
  });

  selectOption(option: DisaggregationMethod): void {
    if (this.disabled()) return;
    if (option === 'bartlett-lewis' && this.bartlettDisabled()) return;
    this.selected.set(option);
  }
}
