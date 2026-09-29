import { Component, computed, effect, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ConsistencyCheckStateService } from './services/consistency-check-state.service';
import { ProjectStateService } from '../../services/project-state.service';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
  providers: [ConsistencyCheckStateService],
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  readonly state = inject(ConsistencyCheckStateService);
  readonly isAdvancing = signal<boolean>(false);

  readonly hasAnalyzedStation = computed<boolean>(() => {
    return this.state.confirmationStatus() === 'ready' && !!this.state.activeNeighborStation();
  });

  readonly advanceButtonText = computed<string>(() => {
    return this.hasAnalyzedStation()
      ? 'Prosseguir'
      : 'Prosseguir sem verificar consistência';
  });

  readonly isAdvanceDisabled = computed<boolean>(() => {
    return (
      this.state.confirmationStatus() === 'loading' ||
      this.state.isLoadingNeighborData()
    );
  });

  constructor() {
    effect(() => {
      const project = this.state.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Verificação de Consistência', url: `/app/analysis/${project.id}/consistency-check` },
      ]);
    });

    let prevStatus = this.state.confirmationStatus();
    effect(() => {
      const currentStatus = this.state.confirmationStatus();
      if (currentStatus === 'loading' && prevStatus !== 'loading') {
        setTimeout(() => {
          this.scrollToAnalysisCard();
        }, 80);
      }
      prevStatus = currentStatus;
    });
  }

  get shouldShowAnalysisCard(): boolean {
    const status = this.state.confirmationStatus();
    if (status === 'loading') {
      return !!(this.state.selectedNeighbor() || this.state.activeNeighborStation());
    }
    if (status === 'ready') {
      return !!this.state.activeNeighborStation();
    }
    return false;
  }

  onScrollToNeighborCard(): void {
    const el = document.getElementById('neighbor-stations-selection-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToAnalysisCard(): void {
    const el = document.getElementById('neighbor-analysis-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onBack(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;
    this.router.navigate(['/app/analysis', project.id, 'initial-view']);
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('GAP_FILLING').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'tratamento-de-falhas']);
      },
      error: (err) => {
        console.error('Erro ao atualizar etapa do projeto:', err);
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'tratamento-de-falhas']);
      },
    });
  }
}
