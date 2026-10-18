import { Component, computed, effect, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { GapFillingStateService } from './services/gap-filling-state.service';
import { GapFillingService } from '../../services/gap-filling.service';
import { NeighborStationsManagerService } from '../../shared/services/neighbor-stations-manager.service';
import { YearFilterState } from './components/year-data-availability/year-data-availability';
import { toast } from '@spartan-ng/brain/sonner';

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
  private gapFillingService = inject(GapFillingService);
  private router = inject(Router);

  readonly state = inject(GapFillingStateService);
  readonly isAdvancing = signal<boolean>(false);
  readonly yearFilterState = signal<YearFilterState | null>(null);

  readonly selectedPath = signal<'fill' | 'filter'>('fill');
  readonly filterStatus = signal<'default' | 'configured'>('default');
  readonly filterThreshold = signal<number>(90);

  readonly savedManualOverrides = computed<Record<string, 'include' | 'exclude'> | null>(() => {
    const f = this.state.savedFilter();
    if (!f) return null;
    return f.manual_overrides ?? f.manualOverrides ?? null;
  });

  readonly isFilled = computed<boolean>(() => {
    if (!this.state.postMetrics()) return false;
    const currentStation = this.state.activeNeighborStation() ?? this.state.selectedNeighbor();
    const filledId = this.state.filledStationId();
    return !!currentStation && !!filledId && currentStation.id.toLowerCase() === filledId.toLowerCase();
  });

  readonly shouldShowPostMetrics = computed<boolean>(() => {
    return this.state.isFilling() || this.isFilled();
  });

  readonly isYearFilterActive = computed<boolean>(() => {
    return this.selectedPath() === 'filter' || (this.selectedPath() === 'fill' && this.isFilled());
  });

  readonly advanceButtonText = computed<string>(() => {
    if (this.isYearFilterActive()) {
      const s = this.yearFilterState();
      if (s) {
        return `Avançar com ${s.keptCount} ${s.keptCount === 1 ? 'ano' : 'anos'}`;
      }
    }
    return 'Avançar';
  });

  readonly fillStatus = computed<'idle' | 'running' | 'done' | 'error'>(() => {
    if (this.state.isFilling()) return 'running';
    if (this.shouldShowPostMetrics()) return 'done';
    if (this.state.fillError()) return 'error';
    const status = this.state.confirmationStatus();
    if (status === 'loading') return 'running';
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
    if (
      this.state.confirmationStatus() === 'loading' ||
      this.state.isLoadingNeighborData() ||
      this.state.isFilling()
    ) {
      return true;
    }

    if (this.selectedPath() === 'fill' && !this.isFilled()) {
      return true;
    }

    if (this.isYearFilterActive()) {
      const s = this.yearFilterState();
      return !s || s.keptCount === 0;
    }

    return false;
  });

  constructor() {
    effect(() => {
      const project = this.state.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Tratamento de falhas', url: `/app/analysis/${project.id}/gap-filling` },
      ]);
    });

    let prevStatus = this.state.confirmationStatus();
    effect(() => {
      const currentStatus = this.state.confirmationStatus();
      if (currentStatus === 'loading' && prevStatus !== 'loading') {
        setTimeout(() => {
          this.scrollToPreMetricsCard();
        }, 80);
      }
      prevStatus = currentStatus;
    });

    let hasAppliedInitialPath = false;
    effect(() => {
      const path = this.state.initialPath();
      if (path && !hasAppliedInitialPath) {
        hasAppliedInitialPath = true;
        this.selectedPath.set(path);
      }
    });

    effect(() => {
      const filter = this.state.savedFilter();
      if (filter) {
        this.filterStatus.set('configured');
        if (filter.threshold != null) {
          this.filterThreshold.set(filter.threshold);
        }
      }
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

  scrollToPreMetricsCard(): void {
    const el = document.getElementById('gap-filling-pre-metrics-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToPostMetricsCard(): void {
    const el = document.getElementById('gap-filling-post-metrics-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onFillGaps(): void {
    this.state.executeGapFilling();
    setTimeout(() => {
      this.scrollToPostMetricsCard();
    }, 100);
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

  onYearFilterStateChange(state: YearFilterState): void {
    this.yearFilterState.set(state);
    this.filterThreshold.set(state.threshold);
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.isAdvanceDisabled()) return;

    this.isAdvancing.set(true);

    if (this.isYearFilterActive() && this.yearFilterState()) {
      const s = this.yearFilterState()!;
      this.gapFillingService
        .confirmFilter(project.id, {
          threshold: s.threshold,
          manualOverrides: s.manualOverrides,
          source: this.selectedPath() === 'fill' ? 'filled' : 'original',
        })
        .subscribe({
          next: () => {
            this.isAdvancing.set(false);
            this.router.navigate(['/app/analysis', project.id, 'temporal-disaggregation']);
          },
          error: (err: unknown) => {
            console.error('Erro ao salvar filtro de anos:', err);
            this.isAdvancing.set(false);
            toast.error('Não foi possível salvar o filtro de anos. Tente novamente.');
          },
        });
      return;
    }

    this.projectState.updateFurthestStep('TEMPORAL_RESOLUTION').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'temporal-disaggregation']);
      },
      error: (err: unknown) => {
        console.error('Erro ao atualizar etapa do projeto:', err);
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'temporal-disaggregation']);
      },
    });
  }
}

