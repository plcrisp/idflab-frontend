import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideFilter,
  lucideLoader2,
  lucideSparkles,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';

export type PathOption = 'fill' | 'filter';
export type FillStatus = 'idle' | 'running' | 'done' | 'error';
export type FilterStatus = 'default' | 'configured';

@Component({
  selector: 'app-path-selector',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmBadge],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideFilter,
      lucideCheck,
      lucideLoader2,
    }),
  ],
  templateUrl: './path-selector.html',
  styleUrl: './path-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathSelector {
  readonly selected = model<PathOption>('fill');
  readonly fillStatus = input<FillStatus>('idle');
  readonly filterStatus = input<FilterStatus>('default');
  readonly filterThreshold = input<number>(90);
  readonly disabled = input<boolean>(false);

  private readonly fillCardRef = viewChild<ElementRef<HTMLElement>>('fillCard');
  private readonly filterCardRef = viewChild<ElementRef<HTMLElement>>('filterCard');

  readonly fillAriaLabel = computed<string>(() => {
    let statusText = 'não executado';
    switch (this.fillStatus()) {
      case 'running':
        statusText = 'executando';
        break;
      case 'done':
        statusText = 'executado';
        break;
      case 'error':
        statusText = 'falhou';
        break;
    }
    return `Preencher falhas, recomendado, ${statusText}`;
  });

  readonly filterAriaLabel = computed<string>(() => {
    if (this.filterStatus() === 'configured') {
      return `Desconsiderar anos incompletos, configurado, ${this.filterThreshold()} por cento`;
    }
    return 'Desconsiderar anos incompletos';
  });

  selectOption(option: PathOption): void {
    if (this.disabled()) return;
    this.selected.set(option);
  }

  getTabIndex(card: PathOption): number {
    if (this.disabled()) return -1;
    return this.selected() === card ? 0 : -1;
  }

  onKeyDown(event: KeyboardEvent, card: PathOption): void {
    if (this.disabled()) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        this.selectOption('filter');
        this.filterCardRef()?.nativeElement.focus();
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        this.selectOption('fill');
        this.fillCardRef()?.nativeElement.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.selectOption(card);
        break;
      }
    }
  }
}
