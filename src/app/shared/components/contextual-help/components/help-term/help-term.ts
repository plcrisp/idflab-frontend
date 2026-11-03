import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';

@Component({
  selector: 'app-help-term',
  standalone: true,
  imports: [CommonModule, ...HlmPopoverImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-term.html',
})
export class HelpTerm {
  readonly term = input.required<string>();
  readonly definition = input.required<string>();
}
