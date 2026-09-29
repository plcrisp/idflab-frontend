import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConsistencyCheckService } from '../../../../services/consistency-check.service';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ConsistencyCheckResponse } from '../../models/consistency-check.model';

@Component({
  selector: 'app-consistency-analysis',
  standalone: false,
  templateUrl: './consistency-analysis.html',
  styleUrl: './consistency-analysis.scss',
})
export class ConsistencyAnalysis {
  private consistencyCheckService = inject(ConsistencyCheckService);
  private destroyRef = inject(DestroyRef);

  projectId = input<string | null>(null);
  neighborStation = input<NeighborStation | null>(null);

  readonly analysis = signal<ConsistencyCheckResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private analysisSub: Subscription | null = null;
  private lastFetchedKey: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.analysisSub?.unsubscribe();
    });

    effect(() => {
      const pid = this.projectId();
      const station = this.neighborStation();

      if (!pid || !station) {
        untracked(() => {
          this.analysisSub?.unsubscribe();
          this.analysis.set(null);
          this.isLoading.set(false);
          this.error.set(null);
          this.lastFetchedKey = null;
        });
        return;
      }

      const key = `${pid}_${station.id}`;
      if (this.lastFetchedKey === key) {
        return;
      }

      untracked(() => {
        this.lastFetchedKey = key;
        this.loadAnalysis(pid, station.id);
      });
    });
  }

  private loadAnalysis(projectId: string, neighborStationId: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.analysisSub?.unsubscribe();

    this.analysisSub = this.consistencyCheckService
      .getConsistencyCheck(projectId, neighborStationId)
      .subscribe({
        next: (response) => {
          this.analysis.set(response);
          this.isLoading.set(false);

          console.group('📊 [ConsistencyAnalysis] Dados da consistência recebidos da rota /consistency-check');
          console.log('Resposta completa:', response);
          console.log('📈 Dupla Massa (Double Mass):', response.double_mass);
          console.log('🎯 Correlação de Pearson (Pearson):', response.pearson);
          console.log('🛡️ Cobertura Preenchível (Coverage):', response.coverage);
          console.log(
            '📅 Período & Sobreposição:',
            response.period,
            `| Resolução: ${response.resolution}`,
            `| Sobreposição: ${response.overlap_days} dias`,
          );
          console.groupEnd();
        },
        error: (err) => {
          console.error('[ConsistencyAnalysis] Erro ao carregar dados da consistência:', err);
          this.error.set('Não foi possível obter os dados de consistência da estação selecionada.');
          this.isLoading.set(false);
        },
      });
  }
}
