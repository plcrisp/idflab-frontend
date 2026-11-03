import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpFigureKey } from '../../../../../core/models/contextual-help.model';

@Component({
  selector: 'app-help-figure',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
  templateUrl: './help-figure.html',
})
export class HelpFigure {
  readonly figure = input.required<HelpFigureKey>();
  readonly label = input<string>('');

  readonly ariaLabel = computed(() => {
    return this.label() ? `Ilustração da etapa ${this.label()}` : 'Ilustração hidrológica da etapa';
  });
}
