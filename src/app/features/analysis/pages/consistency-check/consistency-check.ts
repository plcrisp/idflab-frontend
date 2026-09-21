import { Component, computed, DestroyRef, effect, inject, signal, Signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { Project } from '../../../../core/models/api/project.model';
import { NeighborStation } from '../../../../core/models/api/station.model';
import { GlobalStats } from '../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private stationService = inject(StationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);

  // Estados das estações vizinhas
  readonly neighbors = signal<NeighborStation[]>([]);
  readonly selectedNeighbor = signal<NeighborStation | null>(null);
  readonly isLoadingNeighbors = signal<boolean>(true);
  readonly isLoadingNeighborData = signal<boolean>(false);

  private readonly summarySkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly isHourly = computed<boolean>(
    () => this.project()?.station?.resolution === 'hourly',
  );

  readonly isLoading = computed<boolean>(
    () => this.isJobRunning() || this.summarySkeleton.showSkeleton(),
  );

  private lastLoadedProjectId: string | null = null;
  private lastLoadedStationId: string | null = null;
  private summarySub: Subscription | null = null;
  private neighborsSub: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
      this.neighborsSub?.unsubscribe();
    });

    effect(() => {
      const project = this.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `/app/project/${project.id}` },
        { label: 'Verificação de Consistência', url: `/app/analysis/${project.id}/consistency-check` },
      ]);
    });

    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        untracked(() => {
          this.summarySub?.unsubscribe();
          this.neighborsSub?.unsubscribe();
          this.lastLoadedProjectId = null;
          this.lastLoadedStationId = null;
          this.stats.set(null);
          this.neighbors.set([]);
          this.selectedNeighbor.set(null);
          this.isLoadingNeighbors.set(true);
        });
        return;
      }

      const projectId = project.id;
      const stationId = project.station?.id || project.station_id;

      untracked(() => {
        this.loadSummary(projectId);
        if (stationId) {
          this.loadNeighbors(stationId);
        }
      });
    });
  }

  private loadSummary(projectId: string): void {
    if (this.lastLoadedProjectId === projectId) {
      return;
    }
    this.lastLoadedProjectId = projectId;
    this.summarySub?.unsubscribe();

    this.summarySub = this.initialVisualizationService
      .getSummary(projectId)
      .pipe(trackWithSkeleton(this.summarySkeleton))
      .subscribe({
        next: (res) => {
          this.stats.set(res?.stats ?? null);
        },
        error: (err) => {
          console.error('Erro ao buscar estatísticas para consistência:', err);
          this.stats.set(null);
        },
      });
  }

  private loadNeighbors(stationId: string): void {
    if (this.lastLoadedStationId === stationId) {
      return;
    }
    this.lastLoadedStationId = stationId;
    this.neighborsSub?.unsubscribe();
    this.isLoadingNeighbors.set(true);

    this.neighborsSub = this.stationService.getNeighborStations(stationId).subscribe({
      next: (neighbors) => {
        console.log('Estações vizinhas carregadas:', neighbors);
        this.neighbors.set(neighbors);
        this.isLoadingNeighbors.set(false);

        if (neighbors.length > 0 && !this.selectedNeighbor()) {
          this.onNeighborSelected(neighbors[0]);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar estações vizinhas:', err);
        this.isLoadingNeighbors.set(false);
      },
    });
  }

  onNeighborSelected(neighbor: NeighborStation): void {
    this.selectedNeighbor.set(neighbor);
    this.isLoadingNeighborData.set(true);

    // Simulação do carregamento de dados da série vizinha para comparação
    setTimeout(() => {
      this.isLoadingNeighborData.set(false);
    }, 1000);
  }

  onSkipToYears(): void {
    const el = document.getElementById('year-selection') || document.querySelector('app-data-availability-ribbon');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'initial-view']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'tratamento-de-falhas']);
  }
}
