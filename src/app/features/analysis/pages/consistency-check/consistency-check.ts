import { Component, computed, DestroyRef, effect, inject, signal, Signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import { Project } from '../../../../core/models/api/project.model';
import { EnsureStationDataRequest, NeighborStation } from '../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../core/models/api/notification.model';
import { GlobalStats } from '../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';
import {
  ConfirmationStatus,
  NeighborProgressInfo,
} from './components/neighbor-station-confirmation/neighbor-station-confirmation';

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
  private notificationsService = inject(NotificationsService);
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
  readonly activeNeighborStation = signal<NeighborStation | null>(null);
  readonly confirmationStatus = signal<ConfirmationStatus>('idle');
  readonly neighborProgress = signal<NeighborProgressInfo | null>(null);
  readonly neighborJobId = signal<string | null>(null);
  private hasSeenActiveJob = false;

  readonly neighborJob = computed<ActiveJobItem | null>(() => {
    const jobId = this.neighborJobId();
    const panel = this.notificationsService.panel();
    if (!panel) return null;

    if (jobId) {
      const found = panel.active_jobs.find(
        (job) => String(job.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );
      if (found) return found;
    }

    const p = this.project();
    if (p) {
      return (
        panel.active_jobs.find(
          (job) =>
            job.project_id === p.id &&
            job.task_type === 'DOWNLOAD_NEIGHBOR_STATION_DATA',
        ) ?? null
      );
    }

    return null;
  });

  readonly isSelectionLocked = signal<boolean>(false);
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
      this.projectState.setNeighborJobId(null);
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
          this.activeNeighborStation.set(null);
          this.confirmationStatus.set('idle');
          this.neighborProgress.set(null);
          this.neighborJobId.set(null);
          this.hasSeenActiveJob = false;
          this.projectState.setNeighborJobId(null);
          this.isSelectionLocked.set(false);
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

    // Quando o job real estiver presente nos active_jobs, sincroniza neighborJobId, status e seleção
    effect(() => {
      const job = this.neighborJob();
      if (job) {
        this.hasSeenActiveJob = true;
        untracked(() => {
          if (!this.neighborJobId()) {
            this.neighborJobId.set(job.job_id);
            this.projectState.setNeighborJobId(job.job_id);
          }
          if (this.confirmationStatus() !== 'loading') {
            this.confirmationStatus.set('loading');
          }
          if (this.neighborProgress()) {
            this.neighborProgress.set(null);
          }
          if (job.station_name && this.neighbors().length > 0) {
            const currentSelected = this.selectedNeighbor();
            if (!currentSelected || currentSelected.name.toLowerCase() !== job.station_name.toLowerCase()) {
              const matched = this.neighbors().find(
                (n) => n.name.toLowerCase() === job.station_name!.toLowerCase(),
              );
              if (matched) {
                this.selectedNeighbor.set(matched);
              }
            }
          }
        });
      }
    });

    // Observa o painel de notificações para detectar a conclusão ou falha do job da estação vizinha
    effect(() => {
      const jobId = this.neighborJobId();
      if (!jobId) return;

      const panel = this.notificationsService.panel();
      if (!panel) return;

      const notification = panel.notifications.find(
        (n) => n.job_id && String(n.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );
      if (notification) {
        if (notification.type === 'SUCCESS') {
          let neighbor = this.selectedNeighbor() ?? this.activeNeighborStation();
          if (notification.station_name && this.neighbors().length > 0) {
            const matched = this.neighbors().find(
              (n) => n.name.toLowerCase() === notification.station_name!.toLowerCase(),
            );
            if (matched) {
              neighbor = matched;
              this.selectedNeighbor.set(matched);
            }
          }
          if (neighbor) {
            this.activeNeighborStation.set(neighbor);
          }
          this.confirmationStatus.set('ready');
          this.neighborProgress.set(null);
          this.neighborJobId.set(null);
          this.hasSeenActiveJob = false;
          this.projectState.setNeighborJobId(null);
        } else if (notification.type === 'FAILED' || notification.type === 'TIMEOUT') {
          this.confirmationStatus.set('error');
          this.neighborProgress.set(null);
          this.neighborJobId.set(null);
          this.hasSeenActiveJob = false;
          this.projectState.setNeighborJobId(null);
        }
        return;
      }

      // Se o job já esteve ativo e agora não está mais em active_jobs, concluiu com sucesso!
      const isStillActive = panel.active_jobs.some(
        (j) => String(j.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );
      if (this.hasSeenActiveJob && !isStillActive) {
        const neighbor = this.selectedNeighbor() ?? this.activeNeighborStation();
        if (neighbor) {
          this.activeNeighborStation.set(neighbor);
        }
        this.confirmationStatus.set('ready');
        this.neighborProgress.set(null);
        this.neighborJobId.set(null);
        this.hasSeenActiveJob = false;
        this.projectState.setNeighborJobId(null);
      }
    });

    // Se o usuário navegou após notificação de conclusão, pré-seleciona a estação correspondente
    effect(() => {
      const neighbors = this.neighbors();
      if (neighbors.length === 0 || this.activeNeighborStation() || this.neighborJob()) return;

      const panel = this.notificationsService.panel();
      const project = this.project();
      if (!panel || !project) return;

      const latestNeighborNotif = panel.notifications.find(
        (n) =>
          n.project_id === project.id &&
          n.task_type === 'DOWNLOAD_NEIGHBOR_STATION_DATA' &&
          n.type === 'SUCCESS' &&
          n.station_name,
      );

      if (latestNeighborNotif?.station_name) {
        const found = neighbors.find(
          (n) => n.name.toLowerCase() === latestNeighborNotif.station_name!.toLowerCase(),
        );
        if (found) {
          untracked(() => {
            this.selectedNeighbor.set(found);
            this.activeNeighborStation.set(found);
            this.confirmationStatus.set('ready');
          });
        }
      }
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
    if (this.isSelectionLocked()) return;
    this.selectedNeighbor.set(neighbor);
  }

  onConfirmNeighbor(stationId: string): void {
    const neighbor = this.neighbors().find((n) => n.id === stationId);
    if (!neighbor) return;

    const project = this.project();
    if (!project) return;

    this.confirmationStatus.set('loading');
    this.neighborProgress.set({
      message: `Verificando registros da estação ${neighbor.name}...`,
      percentage: 5,
    });
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;

    const today = new Date().toISOString().split('T')[0];
    const startDate = neighbor.operation_start_date
      ? neighbor.operation_start_date.slice(0, 10)
      : '1900-01-01';
    let endDate = neighbor.last_data_date
      ? neighbor.last_data_date.slice(0, 10)
      : today;

    if (endDate > today) {
      endDate = today;
    }

    const payload: EnsureStationDataRequest = {
      start_date: startDate,
      end_date: endDate,
      project_id: project.id,
    };

    this.stationService.ensureStationData(stationId, payload).subscribe({
      next: (response) => {
        if (response.status === 'ready') {
          this.activeNeighborStation.set(neighbor);
          this.confirmationStatus.set('ready');
          this.neighborProgress.set(null);
          this.neighborJobId.set(null);
          this.projectState.setNeighborJobId(null);
          toast.success(
            response.message || `Os dados da estação ${neighbor.name} já estão disponíveis.`,
            { duration: 5000, position: 'bottom-center' },
          );
        } else if (response.status === 'processing') {
          const jobId = response.job_id ?? null;
          if (jobId) {
            this.neighborJobId.set(jobId);
            this.projectState.setNeighborJobId(jobId);
          }
          this.neighborProgress.set({
            message: response.message || `Iniciando coleta de dados da estação ${neighbor.name}...`,
            percentage: 10,
          });
          this.notificationsService.refetch();
          toast.info(
            `A busca por dados da estação ${neighbor.name} foi iniciada em segundo plano.`,
            { duration: 6000, position: 'bottom-center' },
          );
        }
      },
      error: (err) => {
        console.error('Erro ao verificar/buscar dados da estação vizinha:', err);
        this.confirmationStatus.set('error');
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

  onLockSelection(locked: boolean): void {
    this.isSelectionLocked.set(locked);
  }

  onScrollToNeighborCard(): void {
    const el = document.getElementById('neighbor-stations-selection-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
