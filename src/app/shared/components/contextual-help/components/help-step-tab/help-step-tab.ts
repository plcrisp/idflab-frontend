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
  lucideHash,
  lucideSlidersHorizontal,
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
      lucideHash,
      lucideSlidersHorizontal,
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

  // Accordions iniciam fechados por padrão
  readonly openHowItWorks = signal<boolean>(false);
  readonly openInterpret = signal<boolean>(false);
  readonly openNumbers = signal<boolean>(false);
  readonly openReferences = signal<boolean>(false);

  readonly parsedHowItWorks = computed(() => {
    const items = this.step().howItWorks;
    if (!items) return [];
    return items.map((item) => {
      if (typeof item !== 'string') {
        return {
          title: item.title,
          text: item.text,
        };
      }
      const dotIndex = item.indexOf('. ');
      if (dotIndex > 0 && dotIndex < item.length - 2) {
        return {
          title: item.slice(0, dotIndex + 1).trim(),
          text: item.slice(dotIndex + 2).trim(),
        };
      }
      return {
        text: item,
      };
    });
  });

  readonly stepNumber = computed(() => {
    const idx = HELP_STEP_ORDER.indexOf(this.step().id);
    return idx >= 0 ? String(idx + 1).padStart(2, '0') : '';
  });

  readonly hasInterpretItems = computed(() => {
    const i = this.step().interpret;
    return !!(i && (i.good || i.warning || i.problem));
  });

  readonly hasNumbersGuide = computed(() => {
    return (this.step().numbersGuide?.length ?? 0) > 0;
  });

  constructor() {
    // Ao alternar a etapa visualizada, todos os accordions vêm fechados
    effect(() => {
      this.step();
      untracked(() => {
        this.openHowItWorks.set(false);
        this.openInterpret.set(false);
        this.openNumbers.set(false);
        this.openReferences.set(false);
      });
    });
  }

  toggleHowItWorks(card?: HTMLElement) {
    this.openHowItWorks.update((v) => !v);
    if (this.openHowItWorks() && card) {
      this.scrollToAccordion(card);
    }
  }

  toggleInterpret(card?: HTMLElement) {
    this.openInterpret.update((v) => !v);
    if (this.openInterpret() && card) {
      this.scrollToAccordion(card);
    }
  }

  toggleNumbers(card?: HTMLElement) {
    this.openNumbers.update((v) => !v);
    if (this.openNumbers() && card) {
      this.scrollToAccordion(card);
    }
  }

  toggleReferences(card?: HTMLElement) {
    this.openReferences.update((v) => !v);
    if (this.openReferences() && card) {
      this.scrollToAccordion(card);
    }
  }

  private scrollToAccordion(element: HTMLElement) {
    setTimeout(() => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 60);
  }
}
