import { computed, DestroyRef, effect, inject, Injectable, signal, Signal, untracked } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { ProjectStateService } from '../../../services/project-state.service';
import { InitialVisualizationService } from '../../../services/initial-visualization.service';
import { StationService } from '../../../../../core/services/api/stations.service';
import { NotificationsService } from '../../../../../core/services/api/notifications.service';
import { ProjectStepsService } from '../../../../../core/services/api/project-steps.service';
import { Project } from '../../../../../core/models/api/project.model';
import { NeighborStation } from '../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../core/models/api/notification.model';
import {
  ConsistencyStepParams,
  ProjectStepSaveRequest,
} from '../../../../../core/models/api/project-step.model';
import { GlobalStats } from '../../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../../core/utils/skeleton-loading-coordinator';
import { ConfirmationStatus, NeighborProgressInfo } from '../models/consistency-check.model';
import { buildEnsureStationDataPayload } from '../utils/consistency-check.utils';

@Injectable()
export class ConsistencyCheckStateService {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private stationService = inject(StationService);
  private notificationsService = inject(NotificationsService);
  private projectStepsService = inject(ProjectStepsService);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);

  // Estados das estações vizinhas
  readonly neighbors = signal<NeighborStation[]>([]);
  readonly selectedNeighbor = signal<NeighborStation | null>(null);
  readonly activeNeighborStation = signal<NeighborStation | null>(null);
  readonly confirmationStatus = signal<ConfirmationStatus>('idle');
  readonly neighborProgress = signal<NeighborProgressInfo | null>(null);
  readonly neighborJobId = signal<string | null>(null);
  readonly isSelectionLocked = signal<boolean>(false);
  readonly isLoadingNeighbors = signal<boolean>(true);
  readonly isLoadingNeighborData = signal<boolean>(false);

  private hasSeenActiveJob = false;
  private savedNeighborStationId: string | null = null;
  private savedJobId: string | null = null;
  private lastLoadedProjectId: string | null = null;
  private lastLoadedStationId: string | null = null;
  private lastLoadedStepProjectId: string | null = null;

  private summarySub: Subscription | null = null;
  private neighborsSub: Subscription | null = null;
  private stepSub: Subscription | null = null;

  readonly neighborJob = computed<ActiveJobItem | null>(() => {
    const jobId = this.neighborJobId();
    if (!jobId) return null;
    const panel = this.notificationsService.panel();
    return (
      panel?.active_jobs.find(
        (job) => String(job.job_id).toLowerCase() === String(jobId).toLowerCase(),
      ) ?? null
    );
  });

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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
      this.neighborsSub?.unsubscribe();
      this.stepSub?.unsubscribe();
      this.projectState.setNeighborJobId(null);
    });

    // Reagir a mudanças no projeto ou estado de execução de job principal
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
        if (stationId) {
          this.loadNeighbors(stationId);
        }
        this.loadSavedStep(projectId);
      });
    });

    // Monitoramento do job de download da estação vizinha (quando disparado ou recuperado do DB)
    effect(() => {
      const jobId = this.neighborJobId();
      if (!jobId) return;

      const panel = this.notificationsService.panel();
      if (!panel) return;

      // 1. Marca se o job está ativo no momento
      const isCurrentlyActive = panel.active_jobs.some(
        (j) => String(j.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );
      if (isCurrentlyActive) {
        this.hasSeenActiveJob = true;
      }

      // 2. Verifica conclusão ou erro nas notificações
      const notification = panel.notifications.find(
        (n) => n.job_id && String(n.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );

      if (notification) {
        if (notification.type === 'SUCCESS') {
          this.onJobSuccess();
        } else if (notification.type === 'FAILED' || notification.type === 'TIMEOUT') {
          this.onJobError();
        }
        return;
      }

      // 3. Caso o job já tenha sido visto ativo e agora não está mais em active_jobs (conclusão silenciosa)
      if (this.hasSeenActiveJob && !isCurrentlyActive) {
        this.onJobSuccess();
      }
    });
  }

  private reset(): void {
    this.summarySub?.unsubscribe();
    this.neighborsSub?.unsubscribe();
    this.stepSub?.unsubscribe();
    this.lastLoadedProjectId = null;
    this.lastLoadedStationId = null;
    this.lastLoadedStepProjectId = null;
    this.savedNeighborStationId = null;
    this.savedJobId = null;
    this.stats.set(null);
    this.neighbors.set([]);
    this.selectedNeighbor.set(null);
    this.activeNeighborStation.set(null);
    this.confirmationStatus.set('idle');
    this.neighborProgress.set(null);
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;
    this.projectState.setNeighborJobId(null);
    this.isSelectionLocked.set(false);
    this.isLoadingNeighbors.set(true);
    this.isLoadingNeighborData.set(false);
  }

  private onJobSuccess(): void {
    const neighbor = this.selectedNeighbor() ?? this.activeNeighborStation();
    const project = this.project();
    if (neighbor) {
      this.activeNeighborStation.set(neighbor);
      if (project) {
        this.saveStep(project.id, neighbor.id, null);
      }
    }
    this.confirmationStatus.set('ready');
    this.isLoadingNeighborData.set(false);
    this.isSelectionLocked.set(false);
    this.neighborProgress.set(null);
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;
    this.projectState.setNeighborJobId(null);
  }

  private onJobError(): void {
    this.confirmationStatus.set('error');
    this.isLoadingNeighborData.set(false);
    this.isSelectionLocked.set(false);
    this.neighborProgress.set(null);
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;
    this.projectState.setNeighborJobId(null);
  }

  loadSavedStep(projectId: string): void {
    if (this.lastLoadedStepProjectId === projectId) {
      return;
    }
    this.lastLoadedStepProjectId = projectId;
    this.stepSub?.unsubscribe();

    this.stepSub = this.projectStepsService
      .getProjectStep<ConsistencyStepParams>(projectId, 'CONSISTENCY')
      .subscribe({
        next: (step) => {
          const neighborStationId = step?.params?.neighbor_station_id;
          const stepJobId = step?.job_id;
          if (neighborStationId) {
            this.savedNeighborStationId = neighborStationId;
            this.savedJobId = stepJobId ?? null;
            this.applySavedNeighbor(neighborStationId, this.savedJobId);
          }
        },
        error: (err) => {
          // 404: etapa ainda não salva para este projeto
          if (err.status !== 404) {
            console.error('Erro ao buscar etapa de consistência salva:', err);
          }
        },
      });
  }

  private applySavedNeighbor(stationId: string, savedJobId?: string | null): void {
    const found = this.neighbors().find((n) => n.id === stationId);
    if (found) {
      this.activateSavedNeighbor(found, savedJobId);
      return;
    }

    // Se ainda estiver carregando a lista de vizinhos, aguarda a resposta
    if (this.isLoadingNeighbors()) {
      return;
    }

    // Se a estação salva não veio na lista padrão (ex: fora do raio/limite), busca diretamente
    this.stationService.getStationById(stationId).subscribe({
      next: (st) => {
        const neighbor: NeighborStation = {
          id: st.id,
          code: st.code,
          name: st.name,
          source: st.source,
          latitude: st.latitude,
          longitude: st.longitude,
          distance_km: (st as any).distance_km ?? 0,
          temporal_resolution: (st as any).resolution ?? (st as any).temporal_resolution ?? 'daily',
          operation_start_date: st.operation_start_date,
          last_data_date: st.last_data_date ?? '',
          city: st.city,
          state: st.state,
        };

        this.neighbors.update((list) => {
          if (list.some((n) => n.id === neighbor.id)) return list;
          return [neighbor, ...list];
        });
        this.activateSavedNeighbor(neighbor, savedJobId);
      },
      error: (err) => {
        console.error('Erro ao buscar detalhes da estação salva:', err);
      },
    });
  }

  private activateSavedNeighbor(neighbor: NeighborStation, savedJobId?: string | null): void {
    this.selectedNeighbor.set(neighbor);

    if (savedJobId) {
      // O step tem um job_id ativo gravado no banco!
      this.neighborJobId.set(savedJobId);
      this.projectState.setNeighborJobId(savedJobId);
      this.confirmationStatus.set('loading');
      this.isLoadingNeighborData.set(true);
      this.isSelectionLocked.set(true);

      const formattedNeighborName = new TitleCasePipe().transform(neighbor.name) || neighbor.name;
      this.neighborProgress.set({
        message: `Processando registros da estação ${formattedNeighborName}...`,
        percentage: 15,
      });

      this.notificationsService.refetch();

      const project = this.project();
      if (project) {
        const payload = buildEnsureStationDataPayload(neighbor, project.id);
        this.stationService.ensureStationData(neighbor.id, payload).subscribe({
          next: (res) => {
            if (res.status === 'ready') {
              this.onJobSuccess();
            } else if (res.status === 'processing') {
              const currentJobId = res.job_id ?? savedJobId;
              this.neighborJobId.set(currentJobId);
              this.projectState.setNeighborJobId(currentJobId);
              this.hasSeenActiveJob = true;
            }
          },
          error: (err) => {
            console.error('Erro ao verificar status dos dados da estação salva:', err);
          },
        });
      }
    } else {
      // Sem job pendente, a estação já está confirmada e pronta
      this.activeNeighborStation.set(neighbor);
      this.confirmationStatus.set('ready');
      this.isLoadingNeighborData.set(false);
      this.isSelectionLocked.set(false);
    }
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
        this.neighbors.set(neighbors);
        this.isLoadingNeighbors.set(false);

        if (this.savedNeighborStationId) {
          this.applySavedNeighbor(this.savedNeighborStationId, this.savedJobId);
        } else if (neighbors.length > 0 && !this.selectedNeighbor()) {
          this.selectNeighbor(neighbors[0]);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar estações vizinhas:', err);
        this.isLoadingNeighbors.set(false);
      },
    });
  }

  selectNeighbor(neighbor: NeighborStation): void {
    if (this.isSelectionLocked()) return;
    this.selectedNeighbor.set(neighbor);
  }

  confirmNeighbor(stationId: string): void {
    const neighbor = this.neighbors().find((n) => n.id === stationId);
    if (!neighbor) return;

    const project = this.project();
    if (!project) return;

    const formattedNeighborName = new TitleCasePipe().transform(neighbor.name) || neighbor.name;

    this.confirmationStatus.set('loading');
    this.isLoadingNeighborData.set(true);
    this.isSelectionLocked.set(true);
    this.neighborProgress.set({
      message: `Verificando registros da estação ${formattedNeighborName}...`,
      percentage: 5,
    });
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;

    const payload = buildEnsureStationDataPayload(neighbor, project.id);

    this.stationService.ensureStationData(stationId, payload).subscribe({
      next: (response) => {
        if (response.status === 'ready') {
          this.activeNeighborStation.set(neighbor);
          this.confirmationStatus.set('ready');
          this.isLoadingNeighborData.set(false);
          this.isSelectionLocked.set(false);
          this.neighborProgress.set(null);
          this.neighborJobId.set(null);
          this.projectState.setNeighborJobId(null);

          // Salva o step sem job_id (dados já prontos)
          this.saveStep(project.id, stationId, null);

          toast.success(
            response.message || `Os dados da estação ${formattedNeighborName} já estão disponíveis.`,
            { duration: 5000, position: 'bottom-center' },
          );
        } else if (response.status === 'processing') {
          const jobId = response.job_id ?? null;
          if (jobId) {
            this.neighborJobId.set(jobId);
            this.projectState.setNeighborJobId(jobId);
            // Salva o step associando o job_id em andamento!
            this.saveStep(project.id, stationId, jobId);
          }
          this.neighborProgress.set({
            message: response.message || `Iniciando coleta de dados da estação ${formattedNeighborName}...`,
            percentage: 10,
          });
          this.notificationsService.refetch();
          toast.info(
            `A busca por dados da estação ${formattedNeighborName} foi iniciada em segundo plano.`,
            { duration: 6000, position: 'bottom-center' },
          );
        }
      },
      error: (err) => {
        console.error('Erro ao verificar/buscar dados da estação vizinha:', err);
        this.confirmationStatus.set('error');
        this.isLoadingNeighborData.set(false);
        this.isSelectionLocked.set(false);
        this.neighborProgress.set(null);
        this.neighborJobId.set(null);
        this.projectState.setNeighborJobId(null);
        toast.error('Não foi possível obter os dados da estação. Tente novamente.', {
          duration: 8000,
          position: 'bottom-center',
        });
      },
    });
  }

  private saveStep(projectId: string, stationId: string, jobId: string | null): void {
    const request: ProjectStepSaveRequest<ConsistencyStepParams> = {
      step: 'CONSISTENCY',
      status: 'PENDING',
      params: {
        neighbor_station_id: stationId,
        excluded_years: [],
      },
      job_id: jobId,
    };

    this.projectStepsService.saveProjectStep(projectId, request).subscribe({
      next: () => {
        this.savedNeighborStationId = stationId;
        this.savedJobId = jobId;
      },
      error: (err) => {
        console.error('Erro ao salvar etapa de consistência com job_id:', err);
      },
    });
  }

  lockSelection(locked: boolean): void {
    this.isSelectionLocked.set(locked);
  }
}
