import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

@Component({
  selector: 'app-path',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideCheck,
    }),
  ],
  templateUrl: './path.html',
  styleUrl: './path.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Path {
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input.required<string>();

  readonly select = output<void>();

  onSelect(): void {
    if (this.disabled()) return;
    this.select.emit();
  }
}
