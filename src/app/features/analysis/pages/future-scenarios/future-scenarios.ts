import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile, tap } from 'rxjs/operators';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { JobsService } from '../../../../core/services/api/jobs.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { FutureScenariosService } from '../../services/future-scenarios.service';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';
import { isSubDailyResolution } from '../../../../core/utils/resolution.utils';
import { GlobalStats, StatCardSemanticVariant } from '../../shared/models/analysis.models';
import {
  BiasCorrectionMethod,
  ClimateModel,
  ClimbraCell,
  FutureScenariosStateResponse,
  FutureScenariosUiState,
  SspScenario,
} from './models/future-scenarios.model';
import { getDistributionConfig } from '../distribution/constants/statistical-distribution.constants';
import { DistributionEnum } from '../distribution/models/statistical-distribution.model';
import { AnnualMaxChartItem } from '../initial-visualization/components/annual-max-overview-chart/annual-max-overview-chart';

export interface BiasMethodCardOption {
  value: BiasCorrectionMethod;
  title: string;
  description: string;
  icon: string;
}

export type PeriodPreset = '2041-2070' | '2071-2100' | 'custom';
export type FutureSeriesViewMode = 'raw' | 'corrected';

@Component({
  selector: 'app-future-scenarios',
  standalone: false,
  templateUrl: './future-scenarios.html',
  styleUrl: './future-scenarios.scss',
})
export class FutureScenarios implements OnInit, OnDestroy {
  private readonly mainLayoutService = inject(MainLayoutService);
  private readonly projectState = inject(ProjectStateService);
  private readonly router = inject(Router);
  private readonly initialVisualizationService = inject(InitialVisualizationService);
  private readonly futureScenariosService = inject(FutureScenariosService);
  private readonly jobsService = inject(JobsService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);

  private summarySub: Subscription | null = null;
  private stateSub: Subscription | null = null;
  private applySub: Subscription | null = null;
  private pollSub: Subscription | null = null;

  private readonly summarySkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly isSummaryLoading = computed<boolean>(() => this.summarySkeleton.showSkeleton());

  readonly project = this.projectState.project;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly isHourly = computed<boolean>(() =>
    isSubDailyResolution(this.project()?.station?.resolution),
  );

  readonly stats = signal<GlobalStats | null>(null);
  readonly state = signal<FutureScenariosStateResponse | null>(null);
  readonly isLoadingState = signal<boolean>(false);
  readonly isApplying = signal<boolean>(false);
  readonly isPolling = signal<boolean>(false);
  readonly isAdvancing = signal<boolean>(false);

  readonly polledJobProgress = signal<number | null>(null);
  readonly polledJobMessage = signal<string | null>(null);

  readonly futureChartMode = signal<FutureSeriesViewMode>('corrected');

  readonly methodOptions: readonly BiasMethodCardOption[] = [
    {
      value: 'QM',
      title: 'QM',
      description: 'Alinha a distribuição do modelo à observada',
      icon: 'lucideChartColumn',
    },
    {
      value: 'DBC',
      title: 'DBC',
      description: 'Corrige percentil a percentil, com menor custo',
      icon: 'lucidePercent',
    },
    {
      value: 'EQM',
      title: 'EQM',
      description: 'Preserva o sinal de mudança climática em cada quantil',
      icon: 'lucideTrendingUp',
    },
  ];

  readonly modelOptions: readonly ClimateModel[] = [
    'MIROC6',
    'EC-EARTH3',
    'MRI-ESM2',
    'ACCESS-CM2',
    'HadGEM3-GC31-LL',
  ];

  readonly sspOptions: readonly { value: SspScenario; label: string }[] = [
    { value: 'SSP245', label: 'SSP2-4.5' },
    { value: 'SSP585', label: 'SSP5-8.5' },
  ];

  readonly periodPresetOptions: readonly { value: PeriodPreset; label: string }[] = [
    { value: '2041-2070', label: '2041–2070' },
    { value: '2071-2100', label: '2071–2100' },
    { value: 'custom', label: 'Personalizado (2015–2100)' },
  ];

  readonly selectedMethod = signal<BiasCorrectionMethod | null>(null);
  readonly selectedModel = signal<ClimateModel>('MIROC6');
  readonly selectedSsp = signal<SspScenario>('SSP245');
  readonly periodPreset = signal<PeriodPreset>('2041-2070');
  readonly startYear = signal<number>(2041);
  readonly endYear = signal<number>(2070);

  private lastLoadedProjectId: string | null = null;

  readonly selectedSspLabel = computed<string>(() => {
    const ssp = this.selectedSsp();
    return ssp === 'SSP585' ? 'SSP5-8.5' : 'SSP2-4.5';
  });

  readonly selectedPeriodLabel = computed<string>(() => {
    const preset = this.periodPreset();
    if (preset === '2041-2070') return '2041–2070';
    if (preset === '2071-2100') return '2071–2100';
    return `${this.startYear()}–${this.endYear()}`;
  });

  readonly effectivePeriod = computed<string>(() => `${this.startYear()}-${this.endYear()}`);

  readonly isPeriodValid = computed<boolean>(() => {
    const s = this.startYear();
    const e = this.endYear();
    return (
      Number.isInteger(s) &&
      Number.isInteger(e) &&
      s >= 2015 &&
      e <= 2100 &&
      s < e
    );
  });

  readonly appliedMethod = computed<BiasCorrectionMethod | null>(() => {
    return this.state()?.result?.applied_params?.method ?? null;
  });

  readonly cells = computed<ClimbraCell[] | null>(() => {
    return this.state()?.result?.cells ?? null;
  });

  readonly analysisRadiusKm = computed<number>(() => {
    return this.state()?.result?.analysis_radius_km ?? 25;
  });

  readonly inheritedDistributionText = computed<string>(() => {
    const dist =
      this.state()?.inherited_distribution ??
      this.state()?.result?.inherited_distribution ??
      this.getFallbackDistributionFromSteps();
    if (!dist) return '—';
    const cfg = getDistributionConfig(dist);
    const label = cfg?.name || dist;
    return `${label} (herdada da IDF histórica)`;
  });

  readonly inheritedDisaggregationText = computed<string>(() => {
    const disagg =
      this.state()?.inherited_disaggregation ??
      this.state()?.result?.inherited_disaggregation ??
      this.getFallbackDisaggregationFromSteps();
    if (!disagg) return '—';
    const upper = String(disagg).toUpperCase();
    if (upper.includes('BARTLETT')) return 'Bartlett-Lewis (parâmetros herdados)';
    if (upper.includes('DIRECT')) return 'Agregação direta (herdada)';
    return 'Fatores CETESB (herdada)';
  });

  readonly analysisAreaText = computed<string>(() => {
    const radius = Math.round(this.analysisRadiusKm());
    const cellsList = this.cells();
    if (cellsList && cellsList.length > 0) {
      const count = cellsList.length;
      return `Raio de ${radius} km · ${count} ${count === 1 ? 'célula' : 'células'}`;
    }
    return `Raio de ${radius} km`;
  });

  readonly referenceWindowText = computed<string>(() => {
    return this.state()?.result?.effective_reference_window?.label ?? '1980–2013';
  });

  readonly isSelectionOutdated = computed<boolean>(() => {
    const applied = this.state()?.result?.applied_params;
    if (!applied) return false;
    const currentPeriod = `${this.startYear()}-${this.endYear()}`;
    const appliedPeriod =
      applied.period ||
      (applied.start_year && applied.end_year
        ? `${applied.start_year}-${applied.end_year}`
        : '');
    return (
      this.selectedMethod() !== applied.method ||
      this.selectedModel() !== applied.model ||
      this.selectedSsp() !== applied.ssp ||
      currentPeriod !== appliedPeriod
    );
  });

  readonly effectiveUiState = computed<FutureScenariosUiState>(() => {
    if (this.isApplying() || this.isPolling()) return 'PROCESSING';
    const st = this.state();
    if (!st) return 'INITIAL';
    if (st.ui_state === 'BLOCKED') return 'BLOCKED';
    if (st.ui_state === 'PROCESSING') return 'PROCESSING';
    if (st.ui_state === 'ERROR') return 'ERROR';
    if (st.result) {
      if (st.ui_state === 'OUTDATED' || this.isSelectionOutdated()) {
        return 'OUTDATED';
      }
      return 'RESULT';
    }
    return st.ui_state;
  });

  readonly isBlocked = computed<boolean>(() => this.effectiveUiState() === 'BLOCKED');

  readonly isProcessing = computed<boolean>(() => this.effectiveUiState() === 'PROCESSING');

  readonly isOutdated = computed<boolean>(() => this.effectiveUiState() === 'OUTDATED');

  readonly isError = computed<boolean>(() => this.effectiveUiState() === 'ERROR');

  readonly showResultCard = computed<boolean>(() => {
    const ui = this.effectiveUiState();
    return ui === 'PROCESSING' || ui === 'RESULT' || ui === 'OUTDATED';
  });

  readonly canApply = computed<boolean>(() => {
    if (this.isProcessing() || this.isBlocked()) return false;
    const backendCanApply = this.state()?.can_apply ?? true;
    return (
      backendCanApply &&
      this.selectedMethod() !== null &&
      !!this.selectedModel() &&
      !!this.selectedSsp() &&
      this.isPeriodValid()
    );
  });

  readonly canAdvance = computed<boolean>(() => {
    const st = this.state();
    if (!st || this.effectiveUiState() !== 'RESULT' || this.isProcessing() || this.isAdvancing()) {
      return false;
    }
    return st.can_advance;
  });

  readonly blockedMessage = computed<string>(() => {
    const st = this.state();
    if (st?.message) return st.message;
    if (st?.block_reason === 'CEMADEN') {
      return 'Estações do CEMADEN possuem dados apenas a partir de 2015 e não têm sobreposição com a janela histórica do CLIMBra (1980–2013). Utilize uma estação ANA ou INMET.';
    }
    if (st?.block_reason === 'OUT_OF_COVERAGE') {
      return 'Estação fora da área coberta pelo CLIMBra.';
    }
    return 'A estação não possui série histórica suficiente na janela de referência (1980–2013) para calibrar a correção de viés.';
  });

  readonly errorMessage = computed<string>(() => {
    return (
      this.state()?.message ||
      'Não foi possível concluir a correção de viés para a configuração selecionada.'
    );
  });

  readonly outdatedMessage = computed<string>(() => {
    const st = this.state();
    if (st?.ui_state === 'OUTDATED' && st.message) {
      return st.message;
    }
    return 'Configuração alterada. Aplique novamente';
  });

  readonly progressPercentage = computed<number>(() => {
    return this.polledJobProgress() ?? this.state()?.job_progress ?? 10;
  });

  readonly progressMessage = computed<string>(() => {
    return (
      this.polledJobMessage() ??
      this.state()?.job_message ??
      'Lendo células do CLIMBra e aplicando correção de viés na série histórica e futura...'
    );
  });

  readonly resultHeaderSubtitle = computed<string>(() => {
    const ap = this.state()?.result?.applied_params;
    if (ap && !this.isProcessing()) {
      const ssp = ap.ssp === 'SSP585' ? 'SSP5-8.5' : 'SSP2-4.5';
      const period = (ap.period || `${ap.start_year}-${ap.end_year}`).replace('-', '–');
      return `${ap.model} · ${ap.method} · ${ssp} · ${period}`;
    }
    const method = this.selectedMethod() ?? this.state()?.params?.method ?? '';
    const model = this.selectedModel();
    const ssp = this.selectedSspLabel();
    const period = this.selectedPeriodLabel();
    return [model, method, ssp, period].filter(Boolean).join(' · ');
  });

  readonly futureChartData = computed<AnnualMaxChartItem[]>(() => {
    const list = this.state()?.result?.future_series?.annual_maximums ?? [];
    const mode = this.futureChartMode();
    return list.map((item) => ({
      year: item.year,
      value: mode === 'corrected' ? item.corrected_mm : item.raw_mm,
    }));
  });

  readonly futureChartSeriesName = computed<string>(() => {
    return this.futureChartMode() === 'corrected'
      ? 'Máxima diária anual (corrigido)'
      : 'Máxima diária anual (bruto)';
  });

  readonly futureSeriesSubtitle = computed<string>(() => {
    const fs = this.state()?.result?.future_series;
    if (!fs) return '';
    const periodLabel = (fs.period || `${fs.start_year}-${fs.end_year}`).replace('-', '–');
    const meanVal =
      this.futureChartMode() === 'corrected' ? fs.corrected_mean_mm : fs.raw_mean_mm;
    return `Média ${periodLabel}: ${this.formatMm(meanVal)} mm`;
  });

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Cenários Futuros', url: `/app/analysis/${project.id}/cenarios-futuros` },
      ]);

      if (this.lastLoadedProjectId !== project.id) {
        this.lastLoadedProjectId = project.id;
        untracked(() => {
          this.loadSummaryStats(project.id);
          this.loadState(project.id, true);
        });
      }
    });

    effect(() => {
      const p = this.project();
      const panel = this.notificationsService.panel();
      if (!p || !panel) return;

      const activeJob = panel.active_jobs.find(
        (j) => j.project_id === p.id && j.task_type === 'FUTURE_SCENARIOS',
      );
      if (activeJob && !this.isPolling() && !this.isApplying()) {
        untracked(() => {
          this.startPolling(p.id, activeJob.job_id);
        });
      }
    });
  }

  ngOnInit(): void {
    const p = this.project();
    if (p && this.lastLoadedProjectId !== p.id) {
      this.lastLoadedProjectId = p.id;
      this.loadSummaryStats(p.id);
      this.loadState(p.id, true);
    }
  }

  loadSummaryStats(projectId: string): void {
    this.summarySub?.unsubscribe();
    this.summarySub = this.initialVisualizationService
      .getSummary(projectId)
      .pipe(trackWithSkeleton(this.summarySkeleton))
      .subscribe({
        next: (summary) => {
          this.stats.set(summary.stats);
        },
        error: (err) => {
          console.error('[FutureScenarios] Erro ao carregar estatísticas do resumo:', err);
          this.stats.set(null);
        },
      });
  }

  loadState(projectId: string, syncSelectors = false): void {
    this.stateSub?.unsubscribe();
    this.isLoadingState.set(true);

    this.stateSub = this.futureScenariosService.getState(projectId).subscribe({
      next: (res) => {
        this.state.set(res);
        this.isLoadingState.set(false);
        if (syncSelectors) {
          this.syncSelectorsFromState(res);
        }
        if (res.ui_state === 'PROCESSING') {
          this.startPolling(projectId, res.job_id);
        }
      },
      error: (err) => {
        console.error('[FutureScenarios] Erro ao carregar estado de cenários futuros:', err);
        this.isLoadingState.set(false);
      },
    });
  }

  selectMethod(method: BiasCorrectionMethod): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.selectedMethod.set(method);
  }

  selectModel(model: ClimateModel): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.selectedModel.set(model);
  }

  selectSsp(ssp: SspScenario): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.selectedSsp.set(ssp);
  }

  selectPeriodPreset(preset: PeriodPreset): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.periodPreset.set(preset);
    if (preset === '2041-2070') {
      this.startYear.set(2041);
      this.endYear.set(2070);
    } else if (preset === '2071-2100') {
      this.startYear.set(2071);
      this.endYear.set(2100);
    }
  }

  onStartYearInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(val)) {
      this.startYear.set(Math.trunc(val));
      this.syncPresetFromYears(this.startYear(), this.endYear());
    }
  }

  onEndYearInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(val)) {
      this.endYear.set(Math.trunc(val));
      this.syncPresetFromYears(this.startYear(), this.endYear());
    }
  }

  onApply(): void {
    const project = this.project();
    const method = this.selectedMethod();
    if (!project || !method || !this.canApply()) return;

    this.isApplying.set(true);
    this.polledJobProgress.set(5);
    this.polledJobMessage.set('Iniciando processamento de cenários futuros...');
    this.applySub?.unsubscribe();

    setTimeout(() => this.scrollToResultCard(), 100);

    this.applySub = this.futureScenariosService
      .apply(project.id, {
        method,
        model: this.selectedModel(),
        ssp: this.selectedSsp(),
        period: this.effectivePeriod(),
        start_year: this.startYear(),
        end_year: this.endYear(),
      })
      .subscribe({
        next: (jobRes) => {
          this.isApplying.set(false);
          this.polledJobMessage.set(jobRes.message || null);
          this.notificationsService.refetch();
          this.startPolling(project.id, jobRes.job_id);
        },
        error: (err) => {
          this.isApplying.set(false);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível iniciar a correção de viés. Tente novamente.';
          toast.error(msg);
          this.loadState(project.id, false);
        },
      });
  }

  formatMm(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  formatDeltaPct(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    const absRounded = Math.abs(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    if (Math.abs(value) < 0.05) return '0,0%';
    return value > 0 ? `+${absRounded}%` : `-${absRounded}%`;
  }

  getDeltaBadgeVariant(value: number | null | undefined): StatCardSemanticVariant {
    if (value == null || Number.isNaN(value)) return 'default';
    const abs = Math.abs(value);
    if (abs <= 5) return 'success';
    if (abs <= 15) return 'warning';
    return 'default';
  }

  scrollToResultCard(): void {
    const el = document.getElementById('future-scenarios-result-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
    this.stateSub?.unsubscribe();
    this.applySub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  onBack(): void {
    const project = this.project();
    if (!project || this.isProcessing() || this.isAdvancing()) return;
    this.router.navigate(['/app/analysis', project.id, 'historical-idf']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project || !this.canAdvance()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('RESULTS').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'resultados']);
      },
      error: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'resultados']);
      },
    });
  }

  private startPolling(projectId: string, jobId?: string | null): void {
    this.pollSub?.unsubscribe();
    this.isPolling.set(true);

    this.pollSub = timer(0, 2000)
      .pipe(
        switchMap(() => {
          const activeJobId = jobId ?? this.state()?.job_id;
          if (activeJobId) {
            this.jobsService.getJob(activeJobId).subscribe({
              next: (job) => {
                if (job.progress != null) {
                  this.polledJobProgress.set(job.progress);
                }
                if (job.details?.message) {
                  this.polledJobMessage.set(job.details.message);
                }
              },
              error: () => {},
            });
          }
          return this.futureScenariosService.getState(projectId);
        }),
        tap((res) => {
          this.state.set(res);
          if (res.job_progress != null) {
            this.polledJobProgress.set(res.job_progress);
          }
          if (res.job_message) {
            this.polledJobMessage.set(res.job_message);
          }
        }),
        takeWhile((res) => res.ui_state === 'PROCESSING', true),
      )
      .subscribe({
        next: (res) => {
          if (res.ui_state !== 'PROCESSING') {
            this.isPolling.set(false);
            this.polledJobProgress.set(null);
            this.polledJobMessage.set(null);
            this.notificationsService.refetch();
            this.projectState.refreshSteps();

            if (res.ui_state === 'RESULT') {
              this.syncSelectorsFromState(res);
              this.futureChartMode.set('corrected');
              toast.success('Correção de viés concluída com sucesso!');
              this.projectState.updateFurthestStep('RESULTS').subscribe({
                error: () => {},
              });
              setTimeout(() => this.scrollToResultCard(), 150);
            } else if (res.ui_state === 'ERROR') {
              toast.error(res.message || 'Falha ao processar a correção de viés.');
            }
          }
        },
        error: (err) => {
          console.error('[FutureScenarios] Erro no polling de cenários futuros:', err);
          this.isPolling.set(false);
        },
      });
  }

  private syncSelectorsFromState(res: FutureScenariosStateResponse): void {
    const applied = res.result?.applied_params;
    const params = res.params;
    const source = applied ?? (res.ui_state === 'PROCESSING' ? params : null);

    if (source?.method) {
      this.selectedMethod.set(source.method);
    } else if (!this.selectedMethod()) {
      this.selectedMethod.set(null);
    }

    const model = source?.model ?? params?.model;
    if (model && this.modelOptions.includes(model)) {
      this.selectedModel.set(model);
    }

    const ssp = source?.ssp ?? params?.ssp;
    if (ssp === 'SSP245' || ssp === 'SSP585') {
      this.selectedSsp.set(ssp);
    }

    const sYear = source?.start_year ?? params?.start_year;
    const eYear = source?.end_year ?? params?.end_year;
    if (sYear && eYear) {
      this.startYear.set(sYear);
      this.endYear.set(eYear);
      this.syncPresetFromYears(sYear, eYear);
    }
  }

  private syncPresetFromYears(start: number, end: number): void {
    if (start === 2041 && end === 2070) {
      this.periodPreset.set('2041-2070');
    } else if (start === 2071 && end === 2100) {
      this.periodPreset.set('2071-2100');
    } else {
      this.periodPreset.set('custom');
    }
  }

  private getFallbackDistributionFromSteps(): DistributionEnum | null {
    const steps = this.projectState.projectSteps();
    const distStep = steps.find((s) => s.step === 'DISTRIBUTION');
    const raw =
      distStep?.params?.['selected_distribution'] ??
      distStep?.result?.['suggested_distribution'];
    return raw ? (String(raw).toUpperCase() as DistributionEnum) : null;
  }

  private getFallbackDisaggregationFromSteps(): string | null {
    const steps = this.projectState.projectSteps();
    const tempStep = steps.find((s) => s.step === 'TEMPORAL_RESOLUTION');
    const raw = tempStep?.params?.['method'] ?? tempStep?.result?.['method'];
    return raw ? String(raw) : null;
  }
}
