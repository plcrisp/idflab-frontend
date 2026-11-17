import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ConsistencyCheckService } from '../../../../services/consistency-check.service';
import { ProjectStateService } from '../../../../services/project-state.service';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ConsistencyCheckResponse } from '../../models/consistency-check.model';
import { StatCardFooter, StatCardSemanticVariant } from '../../../../shared/models/analysis.models';

@Component({
  selector: 'app-consistency-analysis',
  standalone: false,
  templateUrl: './consistency-analysis.html',
  styleUrl: './consistency-analysis.scss',
})
export class ConsistencyAnalysis {
  private consistencyCheckService = inject(ConsistencyCheckService);
  private projectState = inject(ProjectStateService);
  private destroyRef = inject(DestroyRef);

  projectId = input<string | null>(null);
  neighborStation = input<NeighborStation | null>(null);

  readonly analysis = signal<ConsistencyCheckResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private analysisSub: Subscription | null = null;
  private lastFetchedKey: string | null = null;

  readonly principalStation = computed(
    () => this.projectState.project()?.station ?? null,
  );
  readonly principalStationName = computed(
    () => this.principalStation()?.name ?? 'Estação Principal',
  );
  readonly neighborStationName = computed(
    () => this.neighborStation()?.name ?? 'Estação Vizinha',
  );

  // Computeds para Pearson
  readonly pearsonVariant = computed<StatCardSemanticVariant>(() => {
    const res = this.analysis();
    if (!res?.pearson) return 'default';
    const label = res.pearson.label;
    if (label === 'strong') return 'success';
    if (label === 'moderate') return 'warning';
    if (label === 'weak') return 'destructive';
    return 'default';
  });

  readonly pearsonValueFormatted = computed<string | null>(() => {
    const res = this.analysis();
    if (!res?.pearson) return null;
    return res.pearson.value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  readonly pearsonTranslatedLabel = computed<string>(() => {
    const res = this.analysis();
    if (!res?.pearson) return '';
    const label = res.pearson.label;
    if (label === 'strong') return 'Correlação forte';
    if (label === 'moderate') return 'Correlação moderada';
    if (label === 'weak') return 'Correlação fraca';
    return '';
  });

  readonly pearsonFooter = computed<StatCardFooter>(() => {
    const res = this.analysis();
    if (!res?.pearson) return null;
    return {
      type: 'progress',
      value: Math.abs(res.pearson.value),
      max: 1,
      variant: this.pearsonVariant(),
      label: this.pearsonTranslatedLabel(),
      subtext: `${res.pearson.n_days.toLocaleString('pt-BR')} dias no período comum`,
    };
  });

  // Computeds para Cobertura
  readonly coverageVariant = computed<StatCardSemanticVariant>(() => {
    const res = this.analysis();
    if (!res?.coverage || res.coverage.percentage == null) return 'default';
    const pct = res.coverage.percentage;
    if (pct > 70) return 'success';
    if (pct >= 40) return 'warning';
    return 'destructive';
  });

  readonly coverageTranslatedLabel = computed<string>(() => {
    const res = this.analysis();
    if (!res?.coverage || res.coverage.percentage == null) return '';
    const pct = res.coverage.percentage;
    if (pct > 70) return 'Boa cobertura';
    if (pct >= 40) return 'Cobertura parcial';
    return 'Baixa cobertura';
  });

  readonly coverageValueFormatted = computed<string | null>(() => {
    const res = this.analysis();
    if (!res?.coverage) return null;
    if (res.coverage.percentage == null) return '—';
    return `${res.coverage.percentage.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  });

  readonly coverageFooter = computed<StatCardFooter>(() => {
    const res = this.analysis();
    if (!res?.coverage) return null;
    const c = res.coverage;

    if (c.percentage == null) {
      return {
        type: 'text',
        content: 'Sem falhas na estação principal a preencher no período.',
      };
    }

    const pctFmt = c.percentage.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const failDaysFmt = c.principal_failure_days.toLocaleString('pt-BR');
    const fillDaysFmt = c.fillable_days.toLocaleString('pt-BR');

    return {
      type: 'progress',
      value: c.percentage,
      max: 100,
      variant: this.coverageVariant(),
      label: this.coverageTranslatedLabel(),
      subtext: `Vizinha tem dado em ${fillDaysFmt} dos ${failDaysFmt} dias com falha (${pctFmt}%)`,
    };
  });

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

          console.group(
            '📊 [ConsistencyAnalysis] Dados da consistência recebidos da rota /consistency-check',
          );
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
