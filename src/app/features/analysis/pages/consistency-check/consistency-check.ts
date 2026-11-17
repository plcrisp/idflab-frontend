import { Component, computed, effect, inject, signal } from '@angular/core';
import { buildAnalysisBreadcrumbs } from '../../../../core/utils/project-step.utils';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ConsistencyCheckStateService } from './services/consistency-check-state.service';
import { ProjectStateService } from '../../services/project-state.service';
import { NeighborStationsManagerService } from '../../shared/services/neighbor-stations-manager.service';
import { ConsistencyCheckService } from '../../services/consistency-check.service';
import { FileDownloadService } from '../../../../core/services/utils/file-download.service';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
  providers: [NeighborStationsManagerService, ConsistencyCheckStateService],
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private consistencyCheckService = inject(ConsistencyCheckService);
  private fileDownloadService = inject(FileDownloadService);
  private router = inject(Router);

  readonly state = inject(ConsistencyCheckStateService);
  readonly isAdvancing = signal<boolean>(false);
  readonly isDownloadingConsistency = signal<boolean>(false);

  readonly hasAnalyzedStation = computed<boolean>(() => {
    return this.state.confirmationStatus() === 'ready' && !!this.state.activeNeighborStation();
  });

  readonly advanceButtonText = computed<string>(() => {
    return this.hasAnalyzedStation()
      ? 'Avançar'
      : 'Avançar sem verificar consistência';
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

      this.mainLayoutService.setBreadcrumbs(
        buildAnalysisBreadcrumbs(project, 'Verificação de Consistência', `/app/analysis/${project.id}/consistency-check`),
      );
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

  onDownloadConsistencyCsv(): void {
    const project = this.state.project();
    const neighbor = this.state.activeNeighborStation();
    if (!project || !neighbor || !this.hasAnalyzedStation() || this.isDownloadingConsistency()) return;

    this.isDownloadingConsistency.set(true);
    this.consistencyCheckService
      .downloadConsistencyCsv(project.id, neighbor.id, ';')
      .pipe(finalize(() => this.isDownloadingConsistency.set(false)))
      .subscribe({
        next: (response) => {
          try {
            this.fileDownloadService.triggerDownload(response, `02-consistencia_${project.id}.csv`);
          } catch (err) {
            console.error('[ConsistencyCheck] Erro ao processar download:', err);
            toast.error('Não foi possível baixar a curva de dupla massa.');
          }
        },
        error: (err) => {
          console.error('[ConsistencyCheck] Erro ao exportar dupla massa:', err);
          toast.error('Não foi possível exportar a curva de dupla massa.');
        },
      });
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;

    this.isAdvancing.set(true);
    this.state
      .completeStep()
      .pipe(
        switchMap(() => this.projectState.updateFurthestStep('GAP_FILLING')),
      )
      .subscribe({
        next: () => {
          this.isAdvancing.set(false);
          this.router.navigate(['/app/analysis', project.id, 'gap-filling']);
        },
        error: (err) => {
          console.error('Erro ao atualizar etapa do projeto:', err);
          this.isAdvancing.set(false);
        },
      });
  }
}
