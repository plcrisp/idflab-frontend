import { Component, computed, effect, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { GapFillingStateService } from './services/gap-filling-state.service';
import { NeighborStationsManagerService } from '../../shared/services/neighbor-stations-manager.service';

@Component({
  selector: 'app-gap-filling',
  standalone: false,
  templateUrl: './gap-filling.html',
  styleUrl: './gap-filling.scss',
  providers: [NeighborStationsManagerService, GapFillingStateService],
})
export class GapFilling {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  readonly state = inject(GapFillingStateService);
  readonly isAdvancing = signal<boolean>(false);

  readonly hasAnalyzedStation = computed<boolean>(() => {
    return this.state.confirmationStatus() === 'ready' && !!this.state.activeNeighborStation();
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
        { label: 'Tratamento de falhas', url: `/app/analysis/${project.id}/tratamento-de-falhas` },
      ]);
    });
  }

  onScrollToNeighborCard(): void {
    const el = document.getElementById('neighbor-stations-selection-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onBack(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;
    this.router.navigate(['/app/analysis', project.id, 'consistency-check']);
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('TEMPORAL_RESOLUTION').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'resolucao-temporal']);
      },
      error: (err) => {
        console.error('Erro ao atualizar etapa do projeto:', err);
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'resolucao-temporal']);
      },
    });
  }
}
