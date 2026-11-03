import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { parseGlossaryTokens } from '../../utils/help-glossary-parser.util';
import { HelpTerm } from '../help-term/help-term';

@Component({
  selector: 'app-help-formatted-text',
  standalone: true,
  imports: [CommonModule, HelpTerm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-formatted-text.html',
})
export class HelpFormattedText {
  readonly text = input.required<string>();
  readonly glossary = input<Record<string, string> | undefined>(undefined);

  readonly tokens = computed(() => {
    return parseGlossaryTokens(this.text(), this.glossary());
  });
}
