import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  HELP_STEP_ORDER,
  HelpStepContent,
  HelpStepId,
} from '../../models/contextual-help.model';
import {
  HELP_CONTENT_DATA,
  HELP_GENERAL_REFERENCES,
} from '../../../shared/components/contextual-help/data/help-content.data';
import { resolveHelpStep } from './resolve-help-step.util';

export { resolveHelpStep };

export type HelpTab = 'step' | 'overview';

@Injectable({
  providedIn: 'root',
})
export class ContextualHelpService {
  private readonly router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly activeTab = signal<HelpTab>('step');

  readonly generalReferences = HELP_GENERAL_REFERENCES;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Real step derived from current active URL (null when outside analysis flow) */
  readonly currentStepId = computed<HelpStepId | null>(() => {
    return resolveHelpStep(this.currentUrl());
  });

  readonly hasCurrentStep = computed<boolean>(() => {
    return this.currentStepId() !== null;
  });

  readonly currentStepIndex = computed<number>(() => {
    const stepId = this.currentStepId();
    return stepId ? HELP_STEP_ORDER.indexOf(stepId) : -1;
  });

  /** The step currently being viewed inside the help drawer (can be navigated independently of the route) */
  readonly viewingStepId = signal<HelpStepId>(HELP_STEP_ORDER[0]);

  readonly viewingStepIndex = computed<number>(() => {
    return HELP_STEP_ORDER.indexOf(this.viewingStepId());
  });

  readonly viewingStepContent = computed<HelpStepContent>(() => {
    return HELP_CONTENT_DATA[this.viewingStepId()];
  });

  readonly hasPreviousStep = computed<boolean>(() => {
    return this.viewingStepIndex() > 0;
  });

  readonly hasNextStep = computed<boolean>(() => {
    return this.viewingStepIndex() < HELP_STEP_ORDER.length - 1;
  });

  constructor() {
    let lastUrl = this.currentUrl();

    // Se o usuário mudar de rota com a gaveta aberta, reavalia a regra de abertura
    effect(() => {
      const url = this.currentUrl();
      const open = this.isOpen();

      if (open && url !== lastUrl) {
        lastUrl = url;
        const stepId = this.currentStepId();

        untracked(() => {
          if (stepId) {
            this.viewingStepId.set(stepId);
            this.activeTab.set('step');
          } else {
            this.viewingStepId.set(HELP_STEP_ORDER[0]);
            this.activeTab.set('overview');
          }
        });
      } else {
        lastUrl = url;
      }
    });
  }

  open(targetStepId?: HelpStepId) {
    if (targetStepId) {
      this.viewingStepId.set(targetStepId);
      this.activeTab.set('step');
    } else {
      const current = this.currentStepId();
      if (current) {
        this.viewingStepId.set(current);
        this.activeTab.set('step');
      } else {
        this.viewingStepId.set(HELP_STEP_ORDER[0]);
        this.activeTab.set('overview');
      }
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  setActiveTab(tab: HelpTab) {
    this.activeTab.set(tab);
  }

  selectStep(stepId: HelpStepId) {
    this.viewingStepId.set(stepId);
    this.activeTab.set('step');
  }

  goToPreviousStep() {
    const currentIndex = this.viewingStepIndex();
    if (currentIndex > 0) {
      this.viewingStepId.set(HELP_STEP_ORDER[currentIndex - 1]);
    }
  }

  goToNextStep() {
    const currentIndex = this.viewingStepIndex();
    if (currentIndex < HELP_STEP_ORDER.length - 1) {
      this.viewingStepId.set(HELP_STEP_ORDER[currentIndex + 1]);
    }
  }
}
