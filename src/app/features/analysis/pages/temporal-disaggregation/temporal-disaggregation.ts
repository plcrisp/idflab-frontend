import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile, tap } from 'rxjs/operators';
import { toast } from '@spartan-ng/brain/sonner';

import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import { ProjectStepsService } from '../../../../core/services/api/project-steps.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { TemporalDisaggregationService } from '../../services/temporal-disaggregation.service';
import { JobsService } from '../../../../core/services/api/jobs.service';
import { NeighborStationsManagerService } from '../../shared/services/neighbor-stations-manager.service';
import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { SkeletonLoadingCoordinator, trackWithSkeleton } from '../../../../core/utils/skeleton-loading-coordinator';
import { GlobalStats } from '../../shared/models/analysis.models';
import { NeighborStation } from '../../../../core/models/api/station.model';
import { Job } from '../../../../core/models/api/job.model';
import { ActiveJobItem } from '../../../../core/models/api/notification.model';
import { DisaggregationMethod } from './components/temporal-disaggregation-path-selector/temporal-disaggregation-path-selector';
import { BartlettLewisParams, CalibrationMetadata } from './models/temporal-disaggregation.model';
import { buildEnsureStationDataPayload } from '../consistency-check/utils/consistency-check.utils';

@Component({
  selector: 'app-temporal-disaggregation',
  standalone: false,
  templateUrl: './temporal-disaggregation.html',
  styleUrl: './temporal-disaggregation.scss',
  providers: [NeighborStationsManagerService],
})
export class TemporalDisaggregation {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private projectStepsService = inject(ProjectStepsService);
  private stationService = inject(StationService);
  private disaggregationService = inject(TemporalDisaggregationService);
  private jobsService = inject(JobsService);
  private notificationsService = inject(NotificationsService);
  readonly neighborManager = inject(NeighborStationsManagerService);
  private mainLayoutService = inject(MainLayoutService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly project = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;
  readonly isAdvancing = signal<boolean>(false);

  readonly selectedMethod = signal<DisaggregationMethod>('cetesb');
  readonly stats = signal<GlobalStats | null>(null);

  // Estados de Vizinhas CEMADEN
  readonly neighbors = this.neighborManager.neighbors;
  readonly selectedNeighbor = this.neighborManager.selectedNeighbor;
  readonly activeNeighborStation = this.neighborManager.activeNeighborStation;
  readonly confirmationStatus = this.neighborManager.confirmationStatus;
  readonly neighborProgress = this.neighborManager.neighborProgress;
  readonly neighborJob = this.neighborManager.neighborJob;
  readonly isLoadingNeighbors = this.neighborManager.isLoadingNeighbors;
  readonly isLoadingNeighborData = this.neighborManager.isLoadingNeighborData;
  readonly isSelectionLocked = this.neighborManager.isSelectionLocked;

  // Estados de Execução - CETESB
  readonly isExecuting = signal<boolean>(false);
  readonly isCetesbExecuted = signal<boolean>(false);

  // Estados de Execução - Bartlett-Lewis & Coleta CEMADEN
  readonly isDownloadingStation = signal<boolean>(false);
  readonly downloadJob = signal<Job | null>(null);

  readonly isExecutingBl = signal<boolean>(false);
  readonly isBartlettExecuted = signal<boolean>(false);
  readonly isBlError = signal<boolean>(false);
  readonly blJob = signal<Job | null>(null);

  readonly calibratedParams = signal<BartlettLewisParams | null>(null);
  readonly calibrationMetadata = signal<CalibrationMetadata | null>(null);
  readonly executedMethod = signal<'CETESB' | 'BARTLETT_LEWIS' | null>(null);

  private summarySub: Subscription | null = null;
  private stepSub: Subscription | null = null;
  private dlSub: Subscription | null = null;
  private blSub: Subscription | null = null;
  private lastLoadedProjectId: string | null = null;
  private lastCheckedStationId: string | null = null;

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

  readonly hasCemadenNeighbors = computed<boolean>(
    () => this.neighbors().length > 0,
  );

  readonly isBartlettDisabled = computed<boolean>(
    () => !this.hasCemadenNeighbors() || this.isLoadingNeighbors(),
  );

  readonly isCalibrationReady = computed<boolean>(
    () => this.confirmationStatus() === 'ready' && !!this.activeNeighborStation(),
  );

  readonly isProcessing = computed<boolean>(() => {
    return (
      this.isExecuting() ||
      this.isExecutingBl() ||
      this.isDownloadingStation() ||
      this.isLoadingNeighborData()
    );
  });

  readonly isCurrentMethodExecuted = computed<boolean>(() => {
    return this.selectedMethod() === 'cetesb'
      ? this.isCetesbExecuted()
      : this.isBartlettExecuted();
  });

  readonly showResultCard = computed<boolean>(() => {
    return this.isProcessing() || this.isCurrentMethodExecuted();
  });

  readonly executedMethodLabel = computed<string>(() => {
    return this.selectedMethod() === 'cetesb' ? 'CETESB' : 'Bartlett-Lewis';
  });

  readonly activeJobForProgress = computed<Job | ActiveJobItem | null>(() => {
    return this.blJob() ?? this.downloadJob() ?? this.neighborJob();
  });

  readonly activeProgressMessage = computed<string | null>(() => {
    if (this.isExecuting()) {
      return 'Aplicando fatores de desagregação CETESB...';
    }
    const bl = this.blJob();
    if (bl?.details?.message) return bl.details.message;

    const dl = this.downloadJob();
    if (dl?.details?.message) return dl.details.message;

    const nJob = this.neighborJob();
    if (nJob?.details?.message) return nJob.details.message;

    const nProg = this.neighborProgress();
    if (nProg?.message) return nProg.message;

    if (this.isExecutingBl()) return 'Iniciando desagregação Bartlett-Lewis...';
    if (this.isDownloadingStation()) return 'Baixando dados pluviométricos da estação CEMADEN...';

    return null;
  });

  readonly activeProgressPercentage = computed<number | null>(() => {
    if (this.isExecuting()) return 50;

    const bl = this.blJob();
    if (bl?.progress != null) return bl.progress;

    const dl = this.downloadJob();
    if (dl?.progress != null) return dl.progress;

    const nJob = this.neighborJob();
    if (nJob?.progress != null) return nJob.progress;

    const nProg = this.neighborProgress();
    if (nProg?.percentage != null) return nProg.percentage;

    if (this.isExecutingBl()) return 10;
    if (this.isDownloadingStation()) return 10;

    return null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
      this.stepSub?.unsubscribe();
      this.dlSub?.unsubscribe();
      this.blSub?.unsubscribe();
      this.neighborManager.reset();
    });

    // 1. Breadcrumbs
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Resolução Temporal', url: `/app/analysis/${project.id}/temporal-disaggregation` },
      ]);
    });

    // 2. Carregamento do projeto e dados iniciais
    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        untracked(() => {
          this.reset();
        });
        return;
      }

      untracked(() => {
        this.loadSummary(project.id);
        const stationId = project.station?.id ?? project.station_id;
        this.checkExistingStep(project.id, stationId);
      });
    });
  }

  private reset(): void {
    this.summarySub?.unsubscribe();
    this.stepSub?.unsubscribe();
    this.dlSub?.unsubscribe();
    this.blSub?.unsubscribe();
    this.lastLoadedProjectId = null;
    this.lastCheckedStationId = null;
    this.stats.set(null);
    this.isCetesbExecuted.set(false);
    this.isBartlettExecuted.set(false);
    this.calibratedParams.set(null);
    this.calibrationMetadata.set(null);
    this.executedMethod.set(null);
    this.blJob.set(null);
    this.downloadJob.set(null);
    this.isDownloadingStation.set(false);
    this.isExecutingBl.set(false);
    this.isBlError.set(false);
    this.neighborManager.reset();
  }

  private loadSummary(projectId: string): void {
    if (this.lastLoadedProjectId === projectId && this.stats()) {
      return;
    }
    this.lastLoadedProjectId = projectId;
    this.summarySub?.unsubscribe();
    this.summarySub = this.initialVisualizationService
      .getSummary(projectId)
      .pipe(trackWithSkeleton(this.summarySkeleton))
      .subscribe({
        next: (res) => this.stats.set(res?.stats ?? null),
        error: (err) => {
          console.error('Erro ao buscar estatísticas para resolução temporal:', err);
          this.stats.set(null);
        },
      });
  }

  private checkExistingStep(projectId: string, stationId?: string | null): void {
    this.stepSub?.unsubscribe();
    this.stepSub = this.projectStepsService
      .getProjectStep<any>(projectId, 'TEMPORAL_RESOLUTION')
      .subscribe({
        next: (step) => {
          const isCompleted = step?.status === 'COMPLETED';
          if (!isCompleted) {
            this.isCetesbExecuted.set(false);
            this.isBartlettExecuted.set(false);
            this.executedMethod.set(null);
            this.calibratedParams.set(null);
            this.calibrationMetadata.set(null);
            if (stationId) {
              this.loadNeighbors(stationId, null, projectId);
            }
            return;
          }

          const rawMethod =
            (step?.params as any)?.method || (step?.result as any)?.method;
          const isBl = rawMethod === 'BARTLETT_LEWIS';

          if (isBl) {
            this.isBartlettExecuted.set(true);
            this.isCetesbExecuted.set(false);
            this.executedMethod.set('BARTLETT_LEWIS');
            this.selectedMethod.set('bartlett-lewis');

            const calibMeta = (step?.result as any)?.calibration_metadata ?? null;
            this.calibrationMetadata.set(calibMeta);

            const calibParams =
              calibMeta?.calibrated_params ||
              (step?.params as any)?.calibrated_params ||
              null;
            this.calibratedParams.set(calibParams);

            const calibStationId =
              (step?.params as any)?.calibration_station_id ||
              calibMeta?.calibration_station_id ||
              null;
            if (stationId) {
              this.loadNeighbors(stationId, calibStationId, projectId);
            }
          } else {
            this.isCetesbExecuted.set(true);
            this.isBartlettExecuted.set(false);
            this.executedMethod.set('CETESB');
            this.selectedMethod.set('cetesb');
            this.calibratedParams.set(null);
            this.calibrationMetadata.set(null);
            if (stationId) {
              this.loadNeighbors(stationId, null, projectId);
            }
          }
        },
        error: () => {
          this.isCetesbExecuted.set(false);
          this.isBartlettExecuted.set(false);
          this.executedMethod.set(null);
          if (stationId) {
            this.loadNeighbors(stationId, null, projectId);
          }
        },
      });
  }

  private loadNeighbors(
    stationId: string,
    initialNeighborId?: string | null,
    projectId?: string,
  ): void {
    if (this.neighborManager.neighbors().length > 0 && this.lastCheckedStationId === stationId) {
      if (initialNeighborId) {
        this.neighborManager.applyStation(initialNeighborId, null, projectId);
      }
      return;
    }

    this.lastCheckedStationId = stationId;
    this.neighborManager.loadNeighbors(
      stationId,
      initialNeighborId ?? null,
      null,
      projectId,
      { calibration_candidates: true },
    );
  }

  onSelectCemadenStation(station: NeighborStation): void {
    this.neighborManager.selectNeighbor(station);
    this.isBlError.set(false);
  }

  onConfirmCemadenStation(stationId: string): void {
    const project = this.project();
    if (!project || this.isProcessing()) return;

    const neighbor = this.neighbors().find((n) => n.id === stationId) ?? this.selectedNeighbor();
    if (!neighbor) return;

    this.neighborManager.selectNeighbor(neighbor);
    this.isBlError.set(false);

    // Abre imediatamente o card de resultado e faz scroll suave!
    this.isDownloadingStation.set(true);
    setTimeout(() => this.scrollToResultCard(), 100);

    const payload = buildEnsureStationDataPayload(neighbor, project.id);

    this.stationService.ensureStationData(stationId, payload).subscribe({
      next: (res) => {
        if (res.status === 'ready') {
          // Dados já disponíveis! Transiciona para ready e inicia a desagregação Bartlett-Lewis
          this.isDownloadingStation.set(false);
          this.neighborManager.activeNeighborStation.set(neighbor);
          this.neighborManager.confirmationStatus.set('ready');
          this.executeBartlettLewisJob(stationId);
        } else if (res.status === 'processing') {
          const jobId = res.job_id;
          if (jobId) {
            this.neighborManager.neighborJobId.set(jobId);
            this.neighborManager.confirmationStatus.set('loading');
            this.startDownloadJobPolling(project.id, jobId, neighbor);
          } else {
            this.isDownloadingStation.set(false);
          }
        }
      },
      error: (err) => {
        this.isDownloadingStation.set(false);
        this.isBlError.set(true);
        const msg =
          err?.error?.detail ??
          err?.error?.message ??
          'Erro ao verificar registros da estação de calibração.';
        toast.error(msg);
      },
    });
  }

  private startDownloadJobPolling(projectId: string, jobId: string, neighbor: NeighborStation): void {
    this.dlSub?.unsubscribe();

    this.dlSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.jobsService.getJob(jobId)),
        tap((job) => this.downloadJob.set(job)),
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
            this.handleDownloadSuccess(projectId, neighbor);
          } else if (status === 'FAILED' || status === 'FAILURE' || status === 'ERROR') {
            this.handleDownloadFailure(job);
          }
        },
        error: (err) => {
          this.isDownloadingStation.set(false);
          const msg = err?.error?.message ?? 'Erro ao acompanhar download da estação.';
          toast.error(msg);
        },
      });
  }

  private handleDownloadSuccess(projectId: string, neighbor: NeighborStation): void {
    this.isDownloadingStation.set(false);
    this.downloadJob.set(null);
    this.neighborManager.neighborJobId.set(null);
    this.neighborManager.confirmationStatus.set('ready');
    this.neighborManager.activeNeighborStation.set(neighbor);
    toast.success('Download dos dados da estação concluído! Iniciando calibração Bartlett-Lewis...');
    this.notificationsService.refetch();

    // Inicia automaticamente a execução do Bartlett-Lewis com os dados já disponíveis
    this.executeBartlettLewisJob(neighbor.id);
  }

  private handleDownloadFailure(job: Job): void {
    this.isDownloadingStation.set(false);
    this.downloadJob.set(null);
    this.neighborManager.neighborJobId.set(null);
    this.neighborManager.confirmationStatus.set('error');
    this.isBlError.set(true);
    const msg =
      job?.details?.error_log ??
      job?.details?.message ??
      'Falha no download dos dados da estação CEMADEN.';
    toast.error(msg);
    this.notificationsService.refetch();
  }

  onExecuteDisaggregation(): void {
    const project = this.project();
    if (!project || this.isProcessing()) return;

    if (this.selectedMethod() === 'cetesb') {
      this.isExecuting.set(true);
      setTimeout(() => this.scrollToResultCard(), 100);

      this.disaggregationService.executeCetesb(project.id).subscribe({
        next: () => {
          this.isExecuting.set(false);
          this.isCetesbExecuted.set(true);
          this.isBartlettExecuted.set(false);
          this.executedMethod.set('CETESB');
          this.calibratedParams.set(null);
          this.calibrationMetadata.set(null);
          toast.success('Desagregação por fatores CETESB executada com sucesso!');
          this.projectState.updateFurthestStep('DISTRIBUTION').subscribe({
            error: (err) => console.error('Erro ao atualizar etapa do projeto:', err),
          });
          setTimeout(() => this.scrollToResultCard(), 100);
        },
        error: (err) => {
          this.isExecuting.set(false);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Erro ao executar a desagregação por fatores CETESB.';
          toast.error(msg);
        },
      });
    } else {
      const activeStation = this.activeNeighborStation() ?? this.selectedNeighbor();
      if (!activeStation) {
        toast.error('Selecione uma estação CEMADEN antes de executar.');
        return;
      }
      this.onConfirmCemadenStation(activeStation.id);
    }
  }

  private executeBartlettLewisJob(stationId: string): void {
    const project = this.project();
    if (!project) return;

    this.isExecutingBl.set(true);
    this.isBlError.set(false);
    this.blJob.set(null);
    this.blSub?.unsubscribe();

    this.disaggregationService
      .executeBartlettLewis(project.id, { calibration_station_id: stationId })
      .subscribe({
        next: (res) => {
          this.startBlJobPolling(project.id, res.job_id);
          setTimeout(() => this.scrollToResultCard(), 100);
        },
        error: (err) => {
          this.isExecutingBl.set(false);
          this.isBlError.set(true);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Erro ao iniciar a desagregação Bartlett-Lewis.';
          toast.error(msg);
        },
      });
  }

  private startBlJobPolling(projectId: string, jobId: string): void {
    if (!jobId) {
      this.isExecutingBl.set(false);
      return;
    }
    this.blSub?.unsubscribe();

    this.blSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.jobsService.getJob(jobId)),
        tap((job) => this.blJob.set(job)),
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
            this.handleBlSuccess(projectId);
          } else if (status === 'FAILED' || status === 'FAILURE' || status === 'ERROR') {
            this.handleBlFailure(job);
          }
        },
        error: (err) => {
          this.isExecutingBl.set(false);
          const msg =
            err?.error?.message ?? 'Erro ao acompanhar processamento da desagregação Bartlett-Lewis.';
          toast.error(msg);
        },
      });
  }

  private handleBlSuccess(projectId: string): void {
    this.isExecutingBl.set(false);
    this.blJob.set(null);
    this.isBartlettExecuted.set(true);
    this.executedMethod.set('BARTLETT_LEWIS');
    toast.success('Desagregação Bartlett-Lewis concluída com sucesso!');
    this.notificationsService.refetch();
    const stationId = this.project()?.station?.id ?? this.project()?.station_id;
    this.checkExistingStep(projectId, stationId);
    this.projectState.updateFurthestStep('DISTRIBUTION').subscribe({
      error: (err) => console.error('Erro ao atualizar etapa do projeto:', err),
    });
    setTimeout(() => this.scrollToResultCard(), 200);
  }

  private handleBlFailure(job: Job): void {
    this.isExecutingBl.set(false);
    this.isBlError.set(true);
    this.blJob.set(null);
    const msg =
      job?.details?.error_log ??
      job?.details?.message ??
      'Falha na desagregação temporal Bartlett-Lewis.';
    toast.error(msg);
    this.notificationsService.refetch();
  }

  scrollToResultCard(): void {
    const el = document.getElementById('temporal-disaggregation-result-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onBack(): void {
    const project = this.project();
    if (!project || this.isAdvancing()) return;
    this.router.navigate(['/app/analysis', project.id, 'gap-filling']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project || this.isAdvancing() || !this.isCurrentMethodExecuted()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('DISTRIBUTION').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'distribution']);
      },
      error: (err) => {
        this.isAdvancing.set(false);
        console.error('Erro ao avançar para distribuição:', err);
        this.router.navigate(['/app/analysis', project.id, 'distribution']);
      },
    });
  }
}
