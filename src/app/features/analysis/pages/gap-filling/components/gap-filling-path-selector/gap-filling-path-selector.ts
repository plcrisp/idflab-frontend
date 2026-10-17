import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFilter,
  lucideLoader2,
  lucideWrench,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { Path } from '../../../../shared/components/path/path';

export type PathOption = 'fill' | 'filter';
export type FillStatus = 'idle' | 'running' | 'done' | 'error';
export type FilterStatus = 'default' | 'configured';

@Component({
  selector: 'app-gap-filling-path-selector',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmBadge, Path],
  providers: [
    provideIcons({
      lucideWrench,
      lucideFilter,
      lucideLoader2,
    }),
  ],
  templateUrl: './gap-filling-path-selector.html',
  styleUrl: './gap-filling-path-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GapFillingPathSelector {
  readonly selected = model<PathOption>('fill');
  readonly fillStatus = input<FillStatus>('idle');
  readonly filterStatus = input<FilterStatus>('default');
  readonly filterThreshold = input<number>(90);
  readonly disabled = input<boolean>(false);

  selectOption(option: PathOption): void {
    if (this.disabled()) return;
    this.selected.set(option);
  }
}
