import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideChevronDown,
  lucideExternalLink,
  lucideMousePointerClick,
} from '@ng-icons/lucide';
import { HelpStepContent } from '../../../../../core/models/contextual-help.model';
import { HelpFigure } from '../help-figure/help-figure';
import { HelpFormattedText } from '../help-formatted-text/help-formatted-text';

@Component({
  selector: 'app-help-step-tab',
  standalone: true,
  imports: [CommonModule, NgIcon, HelpFigure, HelpFormattedText],
  providers: [
    provideIcons({
      lucideActivity,
      lucideChevronDown,
      lucideExternalLink,
      lucideMousePointerClick,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
  templateUrl: './help-step-tab.html',
})
export class HelpStepTab {
  readonly step = input.required<HelpStepContent>();
  readonly analysisState = input<any>(null);

  readonly openHowItWorks = signal<boolean>(false);
  readonly openInterpret = signal<boolean>(false);
  readonly openReferences = signal<boolean>(false);

  readonly hasInterpretItems = computed(() => {
    const i = this.step().interpret;
    return !!(i && (i.good || i.warning || i.problem));
  });

  readonly insightText = computed(() => {
    const fn = this.step().insight;
    if (!fn) return null;
    try {
      return fn(this.analysisState());
    } catch {
      return null;
    }
  });

  constructor() {
    // Whenever viewing step changes, collapse all disclosures by default
    effect(() => {
      this.step();
      untracked(() => {
        this.openHowItWorks.set(false);
        this.openInterpret.set(false);
        this.openReferences.set(false);
      });
    });
  }

  toggleHowItWorks() {
    this.openHowItWorks.update((v) => !v);
  }

  toggleInterpret() {
    this.openInterpret.update((v) => !v);
  }

  toggleReferences() {
    this.openReferences.update((v) => !v);
  }
}
