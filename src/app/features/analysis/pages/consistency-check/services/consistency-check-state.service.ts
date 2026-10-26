import { isSubDailyResolution } from '../../../../../core/utils/resolution.utils';
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
import { catchError, Observable, of, Subscription, switchMap, tap } from 'rxjs';

import { ProjectStateService } from '../../../services/project-state.service';
import { InitialVisualizationService } from '../../../services/initial-visualization.service';
import { ProjectStepsService } from '../../../../../core/services/api/project-steps.service';
import { NeighborStationsManagerService } from '../../../shared/services/neighbor-stations-manager.service';
import { Project } from '../../../../../core/models/api/project.model';
import { NeighborStation } from '../../../../../core/models/api/station.model';
import {
  ConsistencyStepParams,
  ProjectStepResponse,
  ProjectStepSaveRequest,
} from '../../../../../core/models/api/project-step.model';
import { NotificationsService } from '../../../../../core/services/api/notifications.service';
import { GlobalStats } from '../../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../../core/utils/skeleton-loading-coordinator';

@Injectable()
export class ConsistencyCheckStateService {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private projectStepsService = inject(ProjectStepsService);
  private notificationsService = inject(NotificationsService);
  readonly neighborManager = inject(NeighborStationsManagerService);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);
  readonly savedStep = signal<ProjectStepResponse<ConsistencyStepParams> | null>(null);

  // Delegação direta dos estados do NeighborStationsManager
  readonly neighbors = this.neighborManager.neighbors;
  readonly selectedNeighbor = this.neighborManager.selectedNeighbor;
  readonly activeNeighborStation = this.neighborManager.activeNeighborStation;
  readonly confirmationStatus = this.neighborManager.confirmationStatus;
  readonly neighborProgress = this.neighborManager.neighborProgress;
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
    () => isSubDailyResolution(this.project()?.station?.resolution),
  );

  readonly isLoading = computed<boolean>(
    () => this.isJobRunning() || this.summarySkeleton.showSkeleton(),
  );

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
    this.savedStep.set(null);
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
          console.error('Erro ao buscar estatísticas para consistência:', err);
          this.stats.set(null);
        },
      });
  }

  loadSavedStep(projectId: string, stationId?: string | null): void {
    if (this.lastLoadedStepProjectId === projectId) return;
    this.lastLoadedStepProjectId = projectId;
    this.stepSub?.unsubscribe();

    this.stepSub = this.projectStepsService
      .getProjectStep<ConsistencyStepParams>(projectId, 'CONSISTENCY')
      .subscribe({
        next: (step) => {
          this.savedStep.set(step);
          const neighborId = step?.params?.neighbor_station_id;
          const isCompleted = step?.status === 'COMPLETED';

          if (stationId) {
            const panel = this.notificationsService.panel();
            const isJobActive =
              !!step?.job_id &&
              !!panel?.active_jobs.some(
                (j) =>
                  String(j.job_id).toLowerCase() === String(step.job_id).toLowerCase() &&
                  j.task_type === 'DOWNLOAD_NEIGHBOR_STATION_DATA',
              );
            const runningJobId =
              step?.status === 'PENDING' && isJobActive ? step.job_id : null;

            if (neighborId) {
              this.neighborManager.loadNeighbors(
                stationId,
                neighborId,
                runningJobId,
                projectId,
              );
            } else {
              this.neighborManager.loadNeighbors(stationId, null, null, projectId);
            }
          }
        },
        error: (err) => {
          this.savedStep.set(null);
          if (stationId) {
            this.neighborManager.loadNeighbors(stationId, null, null, projectId);
          }
          if (err.status !== 404) {
            console.error('Erro ao buscar etapa de consistência salva:', err);
          }
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

  private saveStep(projectId: string, stationId: string, jobId: string | null): void {
    const currentSaved = this.savedStep();
    const request: ProjectStepSaveRequest<ConsistencyStepParams> = {
      step: 'CONSISTENCY',
      status: 'PENDING',
      params: {
        neighbor_station_id: stationId,
        excluded_years: currentSaved?.params?.excluded_years ?? [],
      },
      result: currentSaved?.result ?? undefined,
      job_id: jobId ? jobId : undefined,
    };

    this.projectStepsService.saveProjectStep(projectId, request).subscribe({
      next: (saved) => {
        this.savedStep.set(saved);
      },
      error: (err) => {
        console.error('Erro ao salvar etapa de consistência com job_id:', err);
      },
    });
  }

  completeStep(): Observable<ProjectStepResponse<ConsistencyStepParams> | null> {
    const project = this.project();
    if (!project) {
      return of(null);
    }

    return this.projectStepsService
      .getProjectStep<ConsistencyStepParams>(project.id, 'CONSISTENCY')
      .pipe(
        catchError(() => of(this.savedStep())),
        switchMap((currentStep) => {
          const activeNeighbor = this.activeNeighborStation();
          const neighborId =
            activeNeighbor?.id ??
            currentStep?.params?.neighbor_station_id ??
            null;

          const request: ProjectStepSaveRequest<ConsistencyStepParams> = {
            step: 'CONSISTENCY',
            status: 'COMPLETED',
            params: {
              neighbor_station_id: neighborId,
              excluded_years: currentStep?.params?.excluded_years ?? [],
            },
            result: currentStep?.result ?? undefined,
            job_id: currentStep?.job_id ?? undefined,
          };

          return this.projectStepsService.saveProjectStep<ConsistencyStepParams>(project.id, request);
        }),
        tap((saved) => {
          this.savedStep.set(saved);
        }),
        catchError((err) => {
          console.error('Erro ao completar etapa de consistência:', err);
          return of(null);
        }),
      );
  }
}
