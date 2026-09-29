import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import { ConfirmationStatus, NeighborProgressInfo } from '../../../../shared/models/analysis.models';
import { ConsistencyCheckResponse } from '../../models/consistency-check.model';
import { ConsistencyCheckService } from '../../../../services/consistency-check.service';
import { ProjectStateService } from '../../../../services/project-state.service';


@Component({
  selector: 'app-neighbor-analysis-card',
  standalone: false,
  templateUrl: './neighbor-analysis-card.html',
  styleUrl: './neighbor-analysis-card.scss',
})
export class NeighborAnalysisCard {
  private consistencyCheckService = inject(ConsistencyCheckService);
  private projectState = inject(ProjectStateService);
  private destroyRef = inject(DestroyRef);

  projectId = input<string | null>(null);
  activeStation = input<NeighborStation | null>(null);
  selectedStation = input<NeighborStation | null>(null);
  status = input<ConfirmationStatus>('idle');
  job = input<ActiveJobItem | null>(null);
  progress = input<NeighborProgressInfo | null>(null);
  isSelectionLocked = input<boolean>(false);

  changeStation = output<void>();

  // Sinais de requisição da consistência (Dupla Massa)
  readonly analysis = signal<ConsistencyCheckResponse | null>(null);
  readonly isAnalysisLoading = signal<boolean>(false);
  readonly analysisError = signal<string | null>(null);

  private analysisSub: Subscription | null = null;
  private lastFetchedKey: string | null = null;

  @ViewChild('loadingContainer') set loadingContainerRef(el: ElementRef<HTMLElement> | undefined) {
    if (el?.nativeElement) {
      setTimeout(() => {
        const card = document.getElementById('neighbor-analysis-card') || el.nativeElement;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  readonly principalStation = computed(
    () => this.projectState.project()?.station ?? null,
  );
  readonly principalStationName = computed(
    () => this.principalStation()?.name ?? 'Estação Principal',
  );

  /**
   * Estação a ser exibida no cabeçalho:
   * Durante 'loading', usa a estação recém-selecionada (selectedStation).
   * Em 'ready', usa a estação ativa e confirmada (activeStation).
   */
  readonly targetStation = computed<NeighborStation | null>(() => {
    if (this.status() === 'loading') {
      return this.selectedStation() ?? this.activeStation();
    }
    return this.activeStation();
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.analysisSub?.unsubscribe();
    });

    effect(() => {
      const status = this.status();
      const pid = this.projectId();
      const activeSt = this.activeStation();

      if (status !== 'ready' || !pid || !activeSt) {
        if (status === 'loading' || status === 'idle') {
          untracked(() => {
            this.analysisSub?.unsubscribe();
            this.analysis.set(null);
            this.isAnalysisLoading.set(false);
            this.analysisError.set(null);
            this.lastFetchedKey = null;
          });
        }
        return;
      }

      const key = `${pid}_${activeSt.id}`;
      if (this.lastFetchedKey === key) {
        return;
      }

      untracked(() => {
        this.lastFetchedKey = key;
        this.loadAnalysis(pid, activeSt.id);
      });
    });
  }

  loadAnalysis(projectId: string, neighborStationId: string): void {
    this.isAnalysisLoading.set(true);
    this.analysisError.set(null);
    this.analysisSub?.unsubscribe();

    this.analysisSub = this.consistencyCheckService
      .getConsistencyCheck(projectId, neighborStationId)
      .subscribe({
        next: (response) => {
          this.analysis.set(response);
          this.isAnalysisLoading.set(false);
        },
        error: (err) => {
          console.error('[NeighborAnalysisCard] Erro ao carregar dados da consistência:', err);
          this.analysisError.set(
            'Não foi possível obter os dados de consistência da estação selecionada.',
          );
          this.isAnalysisLoading.set(false);
        },
      });
  }

  retryAnalysis(): void {
    const pid = this.projectId();
    const st = this.activeStation();
    if (pid && st) {
      this.loadAnalysis(pid, st.id);
    }
  }

  onChangeStation(): void {
    if (this.isSelectionLocked()) return;
    this.changeStation.emit();
  }

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }
}
