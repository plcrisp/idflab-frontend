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
import { Subscription, timer } from 'rxjs';
import { switchMap, tap, takeWhile } from 'rxjs/operators';

import { ProjectStateService } from '../../../services/project-state.service';
import { InitialVisualizationService } from '../../../services/initial-visualization.service';
import { ProjectStepsService } from '../../../../../core/services/api/project-steps.service';
import { JobsService } from '../../../../../core/services/api/jobs.service';
import { NotificationsService } from '../../../../../core/services/api/notifications.service';
import { GapFillingService } from '../../../services/gap-filling.service';
import { NeighborStationsManagerService } from '../../../shared/services/neighbor-stations-manager.service';
import { Project } from '../../../../../core/models/api/project.model';
import { NeighborStation } from '../../../../../core/models/api/station.model';
import { Job } from '../../../../../core/models/api/job.model';
import {
  ConsistencyStepParams,
  GapFillingFilterParams,
  GapFillingStepParams,
  ProjectStepSaveRequest,
} from '../../../../../core/models/api/project-step.model';
import { GapFillingPostMetrics } from '../models/gap-filling.model';
import {
  GapFillingPreMetrics,
  GapFillingPreMetricsResponse,
  GapFillingWarning,
} from '../models/gap-filling-pre-metrics.model';
import { GlobalStats } from '../../../shared/models/analysis.models';
import { poll } from '../../../../../core/utils/polling.utils';
import { toast } from '@spartan-ng/brain/sonner';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../../core/utils/skeleton-loading-coordinator';

@Injectable()
export class GapFillingStateService {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private projectStepsService = inject(ProjectStepsService);
  private gapFillingService = inject(GapFillingService);
  private jobsService = inject(JobsService);
  private notificationsService = inject(NotificationsService);
  readonly neighborManager = inject(NeighborStationsManagerService);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);
  readonly excludedYears = signal<number[]>([]);
  readonly isFilling = signal<boolean>(false);
  readonly fillingJob = signal<Job | null>(null);
  readonly postMetrics = signal<GapFillingPostMetrics | null>(null);
  readonly filledStationId = signal<string | null>(null);
  readonly fillError = signal<string | null>(null);
  readonly savedFilter = signal<GapFillingFilterParams | null>(null);
  readonly initialPath = signal<'fill' | 'filter' | null>(null);

  readonly preMetrics = signal<GapFillingPreMetrics | null>(null);
  readonly preMetricsWarnings = signal<GapFillingWarning[]>([]);
  readonly isLoadingPreMetrics = signal<boolean>(false);
  readonly preMetricsError = signal<string | null>(null);

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
  private fillSub: Subscription | null = null;
  private preMetricsSub: Subscription | null = null;
  private lastFetchedPreMetricsKey: string | null = null;

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
      this.fillSub?.unsubscribe();
      this.preMetricsSub?.unsubscribe();
    });

    this.neighborManager.setOnConfirmed((neighbor, jobId) => {
      const p = this.project();
      if (!p) return;

      const filledId = this.filledStationId();
      const isDifferent =
        !!filledId && filledId.toLowerCase() !== neighbor.id.toLowerCase();

      if (isDifferent) {
        this.postMetrics.set(null);
        this.filledStationId.set(null);
        this.fillError.set(null);
        this.saveStep(p.id, neighbor.id, jobId);
      } else if (!this.postMetrics()) {
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

    // Reage à confirmação/troca da estação vizinha para carregar pré-métricas
    effect(() => {
      const status = this.confirmationStatus();
      const p = this.project();
      const activeSt = this.activeNeighborStation();

      if (status !== 'ready' || !p || !activeSt) {
        if (status === 'loading' || status === 'idle') {
          untracked(() => {
            this.preMetricsSub?.unsubscribe();
            this.preMetrics.set(null);
            this.preMetricsWarnings.set([]);
            this.isLoadingPreMetrics.set(false);
            this.preMetricsError.set(null);
            this.lastFetchedPreMetricsKey = null;
          });
        }
        return;
      }

      const key = `${p.id}_${activeSt.id}`;
      if (this.lastFetchedPreMetricsKey === key) return;

      untracked(() => {
        this.lastFetchedPreMetricsKey = key;
        this.loadPreMetrics(false);
      });
    });
  }

  private reset(): void {
    this.summarySub?.unsubscribe();
    this.stepSub?.unsubscribe();
    this.fillSub?.unsubscribe();
    this.preMetricsSub?.unsubscribe();
    this.lastLoadedProjectId = null;
    this.lastLoadedStationId = null;
    this.lastLoadedStepProjectId = null;
    this.lastFetchedPreMetricsKey = null;
    this.stats.set(null);
    this.excludedYears.set([]);
    this.isFilling.set(false);
    this.fillingJob.set(null);
    this.postMetrics.set(null);
    this.filledStationId.set(null);
    this.fillError.set(null);
    this.savedFilter.set(null);
    this.initialPath.set(null);
    this.preMetrics.set(null);
    this.preMetricsWarnings.set([]);
    this.isLoadingPreMetrics.set(false);
    this.preMetricsError.set(null);
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

  private extractPreMetrics(result: any): GapFillingPreMetricsResponse | null {
    if (!result) return null;
    const fill = result.fill ?? result;
    const pre = fill.pre_metrics ?? fill;
    if (
      pre &&
      (pre.valid_pairs != null ||
        pre.overlap_years != null ||
        pre.fillable_gaps != null)
    ) {
      return {
        metrics: pre as GapFillingPreMetrics,
        warnings: fill.warnings ?? pre.warnings ?? [],
      };
    }
    return null;
  }

  private extractPostMetrics(result: any): GapFillingPostMetrics | null {
    if (!result) return null;
    const metrics = result.fill?.post_metrics ?? result.post_metrics ?? result;
    if (
      metrics &&
      (metrics.filled_count != null ||
        metrics.model_score_r2 != null ||
        metrics.remaining_gaps_pct != null)
    ) {
      return metrics as GapFillingPostMetrics;
    }
    return null;
  }

  private loadSavedStep(projectId: string, stationId?: string | null): void {
    if (this.lastLoadedStepProjectId === projectId) return;
    this.lastLoadedStepProjectId = projectId;
    this.stepSub?.unsubscribe();

    // 1. Tenta carregar o passo GAP_FILLING
    this.stepSub = this.projectStepsService
      .getProjectStep<any>(projectId, 'GAP_FILLING')
      .subscribe({
        next: (step) => {
          const filterParams = step?.params?.filter;
          const fillParams = step?.params?.fill;

          if (filterParams) {
            this.savedFilter.set(filterParams);
          }

          const isFilterSelected = !!filterParams && (filterParams.source === 'original' || !fillParams);
          if (isFilterSelected) {
            this.initialPath.set('filter');
          } else if (fillParams) {
            this.initialPath.set('fill');
          }

          const excluded =
            step?.params?.fill?.excluded_years ??
            step?.params?.filter?.excluded_years ??
            step?.params?.excluded_years;
          if (excluded) {
            this.excludedYears.set(excluded);
          }

          const neighborId =
            step?.params?.fill?.neighbor_station_id ??
            step?.params?.neighbor_station_id;

          const preMetrics = this.extractPreMetrics(step?.result);
          if (preMetrics && neighborId) {
            this.preMetrics.set(preMetrics.metrics);
            this.preMetricsWarnings.set(preMetrics.warnings ?? []);
            this.gapFillingService.setCachedPreMetrics(projectId, neighborId, preMetrics);
          }

          const postMetrics = this.extractPostMetrics(step?.result);
          if (postMetrics) {
            this.postMetrics.set(postMetrics);
            if (neighborId) {
              this.filledStationId.set(neighborId);
            }
          }

          if (stationId) {
            if (neighborId) {
              this.neighborManager.loadNeighbors(stationId, neighborId, null, projectId);
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

  loadPreMetrics(forceRefresh = false): void {
    const p = this.project();
    const activeSt = this.activeNeighborStation();
    if (!p || !activeSt) return;

    this.isLoadingPreMetrics.set(true);
    this.preMetricsError.set(null);
    this.preMetricsSub?.unsubscribe();

    this.preMetricsSub = this.gapFillingService
      .getPreMetrics(p.id, activeSt.id, forceRefresh)
      .subscribe({
        next: (response) => {
          this.preMetrics.set(response.metrics);
          this.preMetricsWarnings.set(response.warnings ?? []);
          this.isLoadingPreMetrics.set(false);
        },
        error: (err) => {
          console.error('[GapFillingStateService] Erro ao carregar métricas pré-preenchimento:', err);
          this.preMetricsError.set('Não foi possível carregar as métricas pré-preenchimento.');
          this.isLoadingPreMetrics.set(false);
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

  executeGapFilling(): void {
    const project = this.project();
    const neighbor = this.activeNeighborStation() ?? this.selectedNeighbor();
    if (!project || !neighbor || this.isFilling()) return;

    this.isFilling.set(true);
    this.fillError.set(null);
    this.fillingJob.set(null);
    this.fillSub?.unsubscribe();

    this.fillSub = this.gapFillingService.fillGaps(project.id, neighbor.id).subscribe({
      next: (res) => {
        const jobId = res.job_id ?? res.jobId;
        this.startJobPolling(project.id, jobId!);
      },
      error: (err) => {
        this.isFilling.set(false);
        const msg = err?.error?.message ?? err?.error?.detail ?? 'Erro ao iniciar o preenchimento de falhas';
        this.fillError.set(msg);
        toast.error(msg);
      },
    });
  }

  private startJobPolling(projectId: string, jobId: string): void {
    if (!jobId || jobId === 'undefined') {
      console.error('[GapFillingStateService] jobId inválido para polling:', jobId);
      this.isFilling.set(false);
      return;
    }
    this.fillSub?.unsubscribe();

    this.fillSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.jobsService.getJob(jobId)),
        tap((job) => this.fillingJob.set(job)),
        takeWhile((job) => {
          const status = (job.status || '').toUpperCase();
          const isDone =
            status === 'SUCCESS' ||
            status === 'COMPLETED' ||
            status === 'FAILED' ||
            status === 'FAILURE' ||
            status === 'ERROR' ||
            (job.progress ?? 0) >= 100;
          return !isDone;
        }, true),
      )
      .subscribe({
        next: (job) => {
          const status = (job.status || '').toUpperCase();
          if (status === 'SUCCESS' || status === 'COMPLETED' || (job.progress ?? 0) >= 100) {
            this.handleJobSuccess(projectId);
          } else if (status === 'FAILED' || status === 'FAILURE' || status === 'ERROR') {
            this.handleJobFailure(job);
          }
        },
        error: (err) => {
          this.isFilling.set(false);
          const msg = err?.error?.message ?? 'Erro ao acompanhar processamento do preenchimento';
          this.fillError.set(msg);
          toast.error(msg);
        },
      });
  }

  private handleJobSuccess(projectId: string): void {
    const filledId =
      (this.activeNeighborStation() ?? this.selectedNeighbor())?.id ?? null;

    this.projectStepsService.getProjectStep<any>(projectId, 'GAP_FILLING').subscribe({
      next: (step) => {
        this.isFilling.set(false);
        const stepNeighborId =
          step?.params?.fill?.neighbor_station_id ??
          step?.params?.neighbor_station_id ??
          filledId;

        const preMetrics = this.extractPreMetrics(step?.result);
        if (preMetrics && stepNeighborId) {
          this.preMetrics.set(preMetrics.metrics);
          this.preMetricsWarnings.set(preMetrics.warnings ?? []);
          this.gapFillingService.setCachedPreMetrics(projectId, stepNeighborId, preMetrics);
        }

        const postMetrics = this.extractPostMetrics(step?.result);
        if (postMetrics) {
          this.postMetrics.set(postMetrics);
          this.filledStationId.set(stepNeighborId);
        }
        this.lastLoadedProjectId = null;
        this.loadSummary(projectId);
        this.notificationsService.refetch();
      },
      error: () => {
        this.isFilling.set(false);
        this.lastLoadedProjectId = null;
        this.loadSummary(projectId);
        this.notificationsService.refetch();
      },
    });
  }

  private handleJobFailure(job: Job): void {
    this.isFilling.set(false);
    const msg =
      job.details?.message ??
      (job.details as any)?.error_log ??
      'Falha no processamento do preenchimento de falhas';
    this.fillError.set(msg);
    toast.error(msg);
  }
}
