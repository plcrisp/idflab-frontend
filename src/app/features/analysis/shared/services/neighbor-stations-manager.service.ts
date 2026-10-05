import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { ProjectStateService } from '../../services/project-state.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import { NeighborStation } from '../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../core/models/api/notification.model';
import { ConfirmationStatus, NeighborProgressInfo } from '../models/analysis.models';
import { buildEnsureStationDataPayload } from '../../pages/consistency-check/utils/consistency-check.utils';

@Injectable()
export class NeighborStationsManagerService {
  private projectState = inject(ProjectStateService);
  private stationService = inject(StationService);
  private notificationsService = inject(NotificationsService);
  private destroyRef = inject(DestroyRef);

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
  private neighborsSub: Subscription | null = null;
  private onConfirmedCallback?: (neighbor: NeighborStation, jobId: string | null) => void;

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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.neighborsSub?.unsubscribe();
      this.projectState.setNeighborJobId(null);
    });

    // Monitoramento do job de download da estação vizinha
    effect(() => {
      const jobId = this.neighborJobId();
      if (!jobId) return;

      const panel = this.notificationsService.panel();
      if (!panel) return;

      const isCurrentlyActive = panel.active_jobs.some(
        (j) => String(j.job_id).toLowerCase() === String(jobId).toLowerCase(),
      );
      if (isCurrentlyActive) {
        this.hasSeenActiveJob = true;
      }

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

      if (this.hasSeenActiveJob && !isCurrentlyActive) {
        this.onJobSuccess();
      }
    });
  }

  setOnConfirmed(callback: (neighbor: NeighborStation, jobId: string | null) => void): void {
    this.onConfirmedCallback = callback;
  }

  loadNeighbors(
    stationId: string,
    initialNeighborId?: string | null,
    savedJobId?: string | null,
    projectId?: string,
  ): void {
    this.neighborsSub?.unsubscribe();
    this.isLoadingNeighbors.set(true);

    this.neighborsSub = this.stationService.getNeighborStations(stationId).subscribe({
      next: (neighbors) => {
        this.neighbors.set(neighbors);
        this.isLoadingNeighbors.set(false);

        if (initialNeighborId) {
          this.applyStation(initialNeighborId, savedJobId, projectId);
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

  confirmNeighbor(stationId: string, projectId: string): void {
    const neighbor = this.neighbors().find((n) => n.id === stationId);
    if (!neighbor) return;

    const formattedName = new TitleCasePipe().transform(neighbor.name) || neighbor.name;

    this.confirmationStatus.set('loading');
    this.isLoadingNeighborData.set(true);
    this.isSelectionLocked.set(true);
    this.neighborProgress.set({
      message: `Verificando registros da estação ${formattedName}...`,
      percentage: 5,
    });
    this.neighborJobId.set(null);
    this.hasSeenActiveJob = false;

    const payload = buildEnsureStationDataPayload(neighbor, projectId);

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

          this.onConfirmedCallback?.(neighbor, null);

          toast.success(
            response.message || `Os dados da estação ${formattedName} já estão disponíveis.`,
            { duration: 5000, position: 'bottom-center' },
          );
        } else if (response.status === 'processing') {
          const jobId = response.job_id ?? null;
          if (jobId) {
            this.neighborJobId.set(jobId);
            this.projectState.setNeighborJobId(jobId);
            this.onConfirmedCallback?.(neighbor, jobId);
          }
          this.neighborProgress.set({
            message:
              response.message ||
              `Iniciando coleta de dados da estação ${formattedName}...`,
            percentage: 10,
          });
          this.notificationsService.refetch();
          toast.info(
            `A busca por dados da estação ${formattedName} foi iniciada em segundo plano.`,
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

  applyStation(stationId: string, savedJobId?: string | null, projectId?: string): void {
    const found = this.neighbors().find((n) => n.id === stationId);
    if (found) {
      this.activateStation(found, savedJobId, projectId);
      return;
    }

    if (this.isLoadingNeighbors()) {
      return;
    }

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
        this.activateStation(neighbor, savedJobId, projectId);
      },
      error: (err) => {
        console.error('Erro ao buscar detalhes da estação salva:', err);
      },
    });
  }

  private activateStation(
    neighbor: NeighborStation,
    savedJobId?: string | null,
    projectId?: string,
  ): void {
    this.selectedNeighbor.set(neighbor);

    if (savedJobId) {
      this.neighborJobId.set(savedJobId);
      this.projectState.setNeighborJobId(savedJobId);
      this.confirmationStatus.set('loading');
      this.isLoadingNeighborData.set(true);
      this.isSelectionLocked.set(true);

      const formattedName = new TitleCasePipe().transform(neighbor.name) || neighbor.name;
      this.neighborProgress.set({
        message: `Processando registros da estação ${formattedName}...`,
        percentage: 15,
      });

      this.notificationsService.refetch();

      if (projectId) {
        const payload = buildEnsureStationDataPayload(neighbor, projectId);
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
      this.activeNeighborStation.set(neighbor);
      this.confirmationStatus.set('ready');
      this.isLoadingNeighborData.set(false);
      this.isSelectionLocked.set(false);
    }
  }

  private onJobSuccess(): void {
    const neighbor = this.selectedNeighbor() ?? this.activeNeighborStation();
    if (neighbor) {
      this.activeNeighborStation.set(neighbor);
      this.onConfirmedCallback?.(neighbor, null);
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

  reset(): void {
    this.neighborsSub?.unsubscribe();
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

  lockSelection(locked: boolean): void {
    this.isSelectionLocked.set(locked);
  }
}
