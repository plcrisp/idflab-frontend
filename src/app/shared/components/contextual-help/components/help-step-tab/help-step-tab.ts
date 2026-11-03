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
  lucideAlertCircle,
  lucideBookOpen,
  lucideCheck,
  lucideCheckCircle2,
  lucideChevronDown,
  lucideExternalLink,
  lucideGauge,
  lucideSlidersHorizontal,
  lucideSparkles,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import {
  HELP_STEP_ORDER,
  HelpStepContent,
} from '../../../../../core/models/contextual-help.model';
import { HelpFigure } from '../help-figure/help-figure';
import { HelpFormattedText } from '../help-formatted-text/help-formatted-text';

@Component({
  selector: 'app-help-step-tab',
  standalone: true,
  imports: [CommonModule, NgIcon, HelpFigure, HelpFormattedText],
  providers: [
    provideIcons({
      lucideActivity,
      lucideAlertCircle,
      lucideBookOpen,
      lucideCheck,
      lucideCheckCircle2,
      lucideChevronDown,
      lucideExternalLink,
      lucideGauge,
      lucideSlidersHorizontal,
      lucideSparkles,
      lucideTriangleAlert,
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

  readonly stepNumber = computed(() => {
    const idx = HELP_STEP_ORDER.indexOf(this.step().id);
    return idx >= 0 ? String(idx + 1).padStart(2, '0') : '';
  });

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
    // Ao alternar a etapa visualizada, mantém os cartões de fundamentos fechados por padrão
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
