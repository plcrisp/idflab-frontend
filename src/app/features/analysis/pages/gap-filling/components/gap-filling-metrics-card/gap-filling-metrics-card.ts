import {
  ChangeDetectionStrategy,
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
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp, lucideMapPin } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import { ConfirmationStatus, NeighborProgressInfo } from '../../../../shared/models/analysis.models';
import { SharedModule } from '../../../../../../shared/shared-module';
import { GapFillingService } from '../../../../services/gap-filling.service';
import {
  GapFillingPreMetrics,
  GapFillingWarning,
} from '../../models/gap-filling-pre-metrics.model';
import { GAP_FILLING_I18N } from '../../constants/gap-filling-pre-metrics.constants';
import { GapFillingPreMetricsPanel } from '../gap-filling-pre-metrics-panel/gap-filling-pre-metrics-panel';

@Component({
  selector: 'app-gap-filling-metrics-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    NgIcon,
    SharedModule,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    GapFillingPreMetricsPanel,
  ],
  providers: [
    provideIcons({
      lucideMapPin,
      lucideArrowUp,
    }),
  ],
  templateUrl: './gap-filling-metrics-card.html',
  styleUrl: './gap-filling-metrics-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GapFillingMetricsCard {
  private readonly gapFillingService = inject(GapFillingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input<string | null>(null);
  readonly activeStation = input<NeighborStation | null>(null);
  readonly selectedStation = input<NeighborStation | null>(null);
  readonly status = input<ConfirmationStatus>('idle');
  readonly job = input<ActiveJobItem | null>(null);
  readonly progress = input<NeighborProgressInfo | null>(null);
  readonly totalYears = input<number | null>(null);
  readonly disabled = input<boolean>(false);

  readonly fillGapsRequested = output<void>();
  readonly skipStepRequested = output<void>();
  readonly changeStation = output<void>();

  readonly metrics = signal<GapFillingPreMetrics | null>(null);
  readonly warnings = signal<GapFillingWarning[]>([]);
  readonly isLoadingMetrics = signal<boolean>(false);
  readonly metricsError = signal<string | null>(null);

  private metricsSub: Subscription | null = null;
  private lastFetchedKey: string | null = null;

  @ViewChild('loadingContainer') set loadingContainerRef(el: ElementRef<HTMLElement> | undefined) {
    if (el?.nativeElement) {
      setTimeout(() => {
        const card = document.getElementById('gap-filling-metrics-card') || el.nativeElement;
        card?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  /**
   * Estação alvo a ser exibida no cabeçalho do card:
   * Durante 'loading', exibe a candidata em processamento (selectedStation).
   * Em 'ready', exibe a estação ativa confirmada (activeStation).
   */
  readonly targetStation = computed<NeighborStation | null>(() => {
    if (this.status() === 'loading') {
      return this.selectedStation() ?? this.activeStation();
    }
    return this.activeStation();
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.metricsSub?.unsubscribe();
    });

    // Reage à confirmação/troca da estação vizinha replicando o padrão do consistency check
    effect(() => {
      const currentStatus = this.status();
      const pid = this.projectId();
      const activeSt = this.activeStation();

      if (currentStatus !== 'ready' || !pid || !activeSt) {
        if (currentStatus === 'loading' || currentStatus === 'idle') {
          untracked(() => {
            this.metricsSub?.unsubscribe();
            this.metrics.set(null);
            this.warnings.set([]);
            this.isLoadingMetrics.set(false);
            this.metricsError.set(null);
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
        this.loadMetrics(pid, activeSt.id);
      });
    });
  }

  loadMetrics(projectId: string, neighborStationId: string, forceRefresh = false): void {
    this.isLoadingMetrics.set(true);
    this.metricsError.set(null);
    this.metricsSub?.unsubscribe();

    this.metricsSub = this.gapFillingService
      .getPreMetrics(projectId, neighborStationId, forceRefresh)
      .subscribe({
        next: (response) => {
          this.metrics.set(response.metrics);
          this.warnings.set(response.warnings ?? []);
          this.isLoadingMetrics.set(false);
        },
        error: (err) => {
          console.error('[GapFillingMetricsCard] Erro ao carregar métricas pré-preenchimento:', err);
          this.metricsError.set(
            GAP_FILLING_I18N.messages.errorPrefix,
          );
          this.isLoadingMetrics.set(false);
        },
      });
  }

  retryMetrics(): void {
    const pid = this.projectId();
    const st = this.activeStation();
    if (pid && st) {
      this.loadMetrics(pid, st.id, true);
    }
  }

  onChangeStation(): void {
    if (this.disabled()) return;
    this.changeStation.emit();
  }

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }
}
