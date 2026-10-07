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

  readonly selectedPath = signal<'fill' | 'filter'>('fill');
  readonly filterStatus = signal<'default' | 'configured'>('default');
  readonly filterThreshold = signal<number>(90);

  readonly fillStatus = computed<'idle' | 'running' | 'done' | 'error'>(() => {
    const status = this.state.confirmationStatus();
    if (status === 'loading') return 'running';
    if (status === 'ready' && this.state.activeNeighborStation()) return 'done';
    if (status === 'error') return 'error';
    return 'idle';
  });

  readonly isPathSelectorDisabled = computed<boolean>(() => {
    return this.state.isSelectionLocked() || this.fillStatus() === 'running';
  });

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

    let prevStatus = this.state.confirmationStatus();
    effect(() => {
      const currentStatus = this.state.confirmationStatus();
      if (currentStatus === 'loading' && prevStatus !== 'loading') {
        setTimeout(() => {
          this.scrollToMetricsCard();
        }, 80);
      }
      prevStatus = currentStatus;
    });
  }

  get shouldShowMetricsCard(): boolean {
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

  scrollToMetricsCard(): void {
    const el = document.getElementById('gap-filling-metrics-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onFillGaps(): void {
    // Ação pronta para a próxima etapa (fora do escopo da atual)
    console.info('[GapFilling] Disparo de preenchimento de falhas solicitado');
  }

  onSkipStep(): void {
    // Ação de pular etapa emitida pelo aviso NO_GAPS
    console.info('[GapFilling] Pular etapa de tratamento de falhas solicitado');
    this.onAdvance();
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

