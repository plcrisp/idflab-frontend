import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { ProjectStateService } from '../../../services/project-state.service';
import { InitialVisualizationService } from '../../../services/initial-visualization.service';
import { ProjectStepsService } from '../../../../../core/services/api/project-steps.service';
import { NeighborStationsManagerService } from '../../../shared/services/neighbor-stations-manager.service';
import { Project } from '../../../../../core/models/api/project.model';
import { NeighborStation } from '../../../../../core/models/api/station.model';
import {
  ConsistencyStepParams,
  GapFillingStepParams,
  ProjectStepSaveRequest,
} from '../../../../../core/models/api/project-step.model';
import { GlobalStats } from '../../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../../core/utils/skeleton-loading-coordinator';

@Injectable()
export class GapFillingStateService {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private projectStepsService = inject(ProjectStepsService);
  readonly neighborManager = inject(NeighborStationsManagerService);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);
  readonly excludedYears = signal<number[]>([]);

  // Delegação direta dos estados do NeighborStationsManager
  readonly neighbors = this.neighborManager.neighbors;
  readonly selectedNeighbor = this.neighborManager.selectedNeighbor;
  readonly activeNeighborStation = this.neighborManager.activeNeighborStation;
  readonly confirmationStatus = this.neighborManager.confirmationStatus;
  readonly neighborProgress = this.neighborProgressInfo;
  readonly neighborJob = this.neighborManager.neighborJob;
  readonly isSelectionLocked = this.neighborManager.isSelectionLocked;
  readonly isLoadingNeighbors = this.neighborManager.isLoadingNeighbors;
  readonly isLoadingNeighborData = this.neighborManager.isLoadingNeighborData;

  private lastLoadedProjectId: string | null = null;
  private lastLoadedStationId: string | null = null;
  private lastLoadedStepProjectId: string | null = null;
  private summarySub: Subscription | null = null;
  private stepSub: Subscription | null = null;

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

  private get neighborProgressInfo() {
    return this.neighborManager.neighborProgress;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
      this.stepSub?.unsubscribe();
    });

    this.neighborManager.setOnConfirmed((neighbor, jobId) => {
      const p = this.project();
      if (p) {
        this.saveStep(p.id, neighbor.id, jobId);
      }
    });

    // Reage a mudanças no projeto
    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        untracked(() => {
          this.reset();
        });
        return;
      }

      const projectId = project.id;
      const stationId = project.station?.id || project.station_id;

      untracked(() => {
        this.loadSummary(projectId);
        this.loadSavedStep(projectId, stationId);
      });
    });
  }

  private reset(): void {
    this.summarySub?.unsubscribe();
    this.stepSub?.unsubscribe();
    this.lastLoadedProjectId = null;
    this.lastLoadedStationId = null;
    this.lastLoadedStepProjectId = null;
    this.stats.set(null);
    this.excludedYears.set([]);
    this.neighborManager.reset();
  }

  private loadSummary(projectId: string): void {
    if (this.lastLoadedProjectId === projectId) return;
    this.lastLoadedProjectId = projectId;
    this.summarySub?.unsubscribe();

    this.summarySub = this.initialVisualizationService
      .getSummary(projectId)
      .pipe(trackWithSkeleton(this.summarySkeleton))
      .subscribe({
        next: (res) => this.stats.set(res?.stats ?? null),
        error: (err) => {
          console.error('Erro ao buscar estatísticas para tratamento de falhas:', err);
          this.stats.set(null);
        },
      });
  }

  private loadSavedStep(projectId: string, stationId?: string | null): void {
    if (this.lastLoadedStepProjectId === projectId) return;
    this.lastLoadedStepProjectId = projectId;
    this.stepSub?.unsubscribe();

    // 1. Tenta carregar o passo GAP_FILLING
    this.stepSub = this.projectStepsService
      .getProjectStep<GapFillingStepParams>(projectId, 'GAP_FILLING')
      .subscribe({
        next: (step) => {
          if (step?.params?.excluded_years) {
            this.excludedYears.set(step.params.excluded_years);
          }
          const neighborId = step?.params?.neighbor_station_id;
          if (stationId) {
            if (neighborId) {
              this.neighborManager.loadNeighbors(stationId, neighborId, step?.job_id, projectId);
            } else {
              this.fallbackToConsistencyStep(projectId, stationId);
            }
          }
        },
        error: (err) => {
          // Se 404, herda automaticamente da etapa de consistência
          if (err.status === 404 && stationId) {
            this.fallbackToConsistencyStep(projectId, stationId);
          } else if (stationId) {
            this.neighborManager.loadNeighbors(stationId, null, null, projectId);
          }
        },
      });
  }

  private fallbackToConsistencyStep(projectId: string, stationId: string): void {
    this.projectStepsService
      .getProjectStep<ConsistencyStepParams>(projectId, 'CONSISTENCY')
      .subscribe({
        next: (consistencyStep) => {
          const neighborId = consistencyStep?.params?.neighbor_station_id;
          this.neighborManager.loadNeighbors(stationId, neighborId, consistencyStep?.job_id, projectId);
        },
        error: () => {
          this.neighborManager.loadNeighbors(stationId, null, null, projectId);
        },
      });
  }

  selectNeighbor(neighbor: NeighborStation): void {
    this.neighborManager.selectNeighbor(neighbor);
  }

  confirmNeighbor(stationId: string): void {
    const project = this.project();
    if (!project) return;
    this.neighborManager.confirmNeighbor(stationId, project.id);
  }

  lockSelection(locked: boolean): void {
    this.neighborManager.lockSelection(locked);
  }

  saveStep(projectId: string, stationId: string, jobId: string | null): void {
    const request: ProjectStepSaveRequest<GapFillingStepParams> = {
      step: 'GAP_FILLING',
      status: 'PENDING',
      params: {
        neighbor_station_id: stationId,
        excluded_years: this.excludedYears(),
      },
      job_id: jobId,
    };

    this.projectStepsService.saveProjectStep(projectId, request).subscribe({
      error: (err) => {
        console.error('Erro ao salvar etapa de preenchimento de falhas:', err);
      },
    });
  }
}
