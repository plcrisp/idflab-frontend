import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight, lucideX } from '@ng-icons/lucide';
import { BrnSheetImports } from '@spartan-ng/brain/sheet';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HelpStepId } from '../../../core/models/contextual-help.model';
import { ContextualHelpService, HelpTab } from '../../../core/services/state/contextual-help.service';
import { HelpStepTab } from './components/help-step-tab/help-step-tab';
import { HelpOverviewTab } from './components/help-overview-tab/help-overview-tab';

@Component({
  selector: 'app-contextual-help-sheet',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ...BrnSheetImports,
    ...HlmSheetImports,
    HlmButton,
    HelpStepTab,
    HelpOverviewTab,
  ],
  providers: [provideIcons({ lucideX, lucideArrowLeft, lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contextual-help-sheet.html',
  styleUrl: './contextual-help-sheet.scss',
})
export class ContextualHelpSheet {
  readonly helpService = inject(ContextualHelpService);

  readonly isOpen = this.helpService.isOpen;
  readonly activeTab = this.helpService.activeTab;
  readonly viewingStepIndex = this.helpService.viewingStepIndex;
  readonly viewingStepContent = this.helpService.viewingStepContent;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  private overviewScrollTop = 0;

  readonly shouldShowFooter = computed(() => {
    return this.activeTab() !== 'overview';
  });

  constructor() {
    // Ao trocar de etapa na ajuda, leva o scroll do corpo ao topo
    effect(() => {
      this.helpService.viewingStepId();
      untracked(() => {
        if (this.scrollContainer?.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = 0;
        }
      });
    });
  }

  onBodyScroll() {
    if (this.activeTab() === 'overview' && this.scrollContainer) {
      this.overviewScrollTop = this.scrollContainer.nativeElement.scrollTop;
    }
  }

  onTabClick(tab: HelpTab) {
    if (this.activeTab() === 'overview' && this.scrollContainer) {
      this.overviewScrollTop = this.scrollContainer.nativeElement.scrollTop;
    }

    this.helpService.setActiveTab(tab);

    if (tab === 'overview') {
      // Restaura o scroll anterior da visão geral
      setTimeout(() => {
        if (this.scrollContainer?.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = this.overviewScrollTop;
        }
      });
    } else {
      // Ao abrir esta etapa, scroll vai para o topo
      setTimeout(() => {
        if (this.scrollContainer?.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = 0;
        }
      });
    }
  }

  onStateChanged(state: 'open' | 'closed') {
    if (state === 'closed') {
      this.helpService.close();
    }
  }

  onOverviewStepSelected(stepId: HelpStepId) {
    if (this.scrollContainer) {
      this.overviewScrollTop = this.scrollContainer.nativeElement.scrollTop;
    }
    this.helpService.selectStep(stepId);
  }
}
