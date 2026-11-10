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
import { Subscription, switchMap, takeWhile, tap, timer } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { FutureScenariosService } from '../../services/future-scenarios.service';
import { JobsService } from '../../../../core/services/api/jobs.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';
import { isSubDailyResolution } from '../../../../core/utils/resolution.utils';
import { GlobalStats } from '../../shared/models/analysis.models';
import {
  BiasCorrectionMethod,
  ClimateModel,
  ClimbraCell,
  FutureScenariosApplyRequest,
  FutureScenariosStateResponse,
  FutureScenariosUiState,
  SspScenario,
} from './models/future-scenarios.model';
import { getDistributionConfig } from '../distribution/constants/statistical-distribution.constants';
import { DistributionEnum } from '../distribution/models/statistical-distribution.model';

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

  readonly selectedMethod = signal<BiasCorrectionMethod | null>('EQM');
  readonly selectedModel = signal<ClimateModel>('MIROC6');
  readonly selectedSsp = signal<SspScenario>('SSP245');
  readonly startYear = signal<number>(2041);
  readonly endYear = signal<number>(2070);

  private lastLoadedProjectId: string | null = null;

  readonly selectedSspLabel = computed<string>(() => {
    return this.selectedSsp() === 'SSP585' ? 'SSP5-8.5' : 'SSP2-4.5';
  });

  readonly effectivePeriod = computed<string>(() => `${this.startYear()}-${this.endYear()}`);

  readonly appliedMethod = computed<BiasCorrectionMethod | null>(() => {
    return this.state()?.result?.applied_params?.method ?? null;
  });

  readonly cells = computed<ClimbraCell[] | null>(() => {
    return this.state()?.result?.cells ?? null;
  });

  readonly analysisRadiusKm = computed<number>(() => {
    return this.state()?.result?.analysis_radius_km ?? 10;
  });

  readonly inheritedDistributionText = computed<string>(() => {
    const dist =
      this.state()?.inherited_distribution ??
      this.state()?.result?.inherited_distribution ??
      this.getFallbackDistributionFromSteps();
    if (!dist) return '—';
    const cfg = getDistributionConfig(dist);
    const label = cfg?.name || dist;
    return `${label} (herdada)`;
  });

  readonly inheritedDisaggregationText = computed<string>(() => {
    const disagg =
      this.state()?.inherited_disaggregation ??
      this.state()?.result?.inherited_disaggregation ??
      this.getFallbackDisaggregationFromSteps();
    if (!disagg) return '—';
    const upper = String(disagg).toUpperCase();
    if (upper.includes('BARTLETT')) return 'Bartlett-Lewis (herdada)';
    if (upper.includes('DIRECT')) return 'Agregação direta (herdada)';
    return 'Fatores CETESB (herdada)';
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
      'Ocorreu um erro ao processar a correção de viés com os parâmetros selecionados. Tente novamente ou use outro método/modelo.'
    );
  });

  readonly progressPercentage = computed<number>(() => {
    const p = this.polledJobProgress();
    if (p != null) return p;
    const st = this.state();
    if (st?.job_progress != null) return st.job_progress;
    return 15;
  });

  readonly progressMessage = computed<string>(() => {
    return (
      this.polledJobMessage() ??
      this.state()?.job_message ??
      'Lendo células do CLIMBra e aplicando correção de viés na série histórica e futura...'
    );
  });

  readonly outdatedMessage = computed<string>(() => {
    return 'Configuração alterada. Clique em "Aplicar correção" para recalcular os cenários futuros com os novos parâmetros.';
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

  loadState(projectId: string, syncSelectors = false, isAfterJobSuccess = false): void {
    this.stateSub?.unsubscribe();
    this.isLoadingState.set(true);

    this.stateSub = this.futureScenariosService.getState(projectId).subscribe({
      next: (res) => {
        this.state.set(res);
        this.isLoadingState.set(false);

        if (syncSelectors) {
          this.syncSelectorsFromState(res);
        }

        if (isAfterJobSuccess && res.ui_state === 'RESULT') {
          this.syncSelectorsFromState(res);
          toast.success('Correção de viés concluída com sucesso!');
          this.projectState.updateFurthestStep('RESULTS').subscribe({
            error: () => {},
          });
          setTimeout(() => this.scrollToResultCard(), 150);
        } else if (res.ui_state === 'PROCESSING' && !this.isPolling()) {
          const jobId =
            res.job_id ||
            this.notificationsService
              .panel()
              ?.active_jobs.find(
                (j) => j.project_id === projectId && j.task_type === 'FUTURE_SCENARIOS',
              )?.job_id;
          if (jobId) {
            this.startJobPolling(projectId, jobId);
          }
        }
      },
      error: (err) => {
        console.error('[FutureScenarios] Erro ao carregar estado de cenários futuros:', err);
        this.isLoadingState.set(false);
      },
    });
  }

  onApply(): void {
    const project = this.project();
    const method = this.selectedMethod();
    if (!project || !method) return;

    this.isApplying.set(true);
    this.polledJobProgress.set(5);
    this.polledJobMessage.set('Iniciando processamento de cenários futuros...');
    this.applySub?.unsubscribe();

    setTimeout(() => this.scrollToResultCard(), 100);

    const payload: FutureScenariosApplyRequest = {
      method,
      model: this.selectedModel(),
      ssp: this.selectedSsp(),
      period: this.effectivePeriod(),
      start_year: this.startYear(),
      end_year: this.endYear(),
    };

    this.applySub = this.futureScenariosService.apply(project.id, payload).subscribe({
      next: (jobRes) => {
        this.isApplying.set(false);
        this.notificationsService.refetch();

        if (jobRes.status === 'RUNNING' || jobRes.status === 'PENDING') {
          this.startJobPolling(project.id, jobRes.job_id);
        } else if (jobRes.status === 'SUCCESS') {
          this.loadState(project.id, false, true);
        } else {
          toast.error(jobRes.message || 'Erro ao agendar o processamento.');
        }
      },
      error: (err) => {
        console.error('[FutureScenarios] Erro ao disparar apply:', err);
        this.isApplying.set(false);
        this.polledJobProgress.set(null);
        this.polledJobMessage.set(null);
        const msg =
          err?.error?.detail ??
          err?.error?.message ??
          'Falha ao iniciar o cálculo dos cenários futuros. Tente novamente.';
        toast.error(msg);
      },
    });
  }

  scrollToResultCard(): void {
    const el = document.getElementById('future-scenarios-result-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
    this.stateSub?.unsubscribe();
    this.applySub?.unsubscribe();
    this.stopJobPolling();
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

  private startJobPolling(projectId: string, jobId: string): void {
    if (!jobId) {
      this.isPolling.set(false);
      return;
    }

    this.stopJobPolling();
    this.isPolling.set(true);

    this.pollSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.jobsService.getJob(jobId)),
        tap((job) => {
          if (job.progress != null) {
            this.polledJobProgress.set(job.progress);
          }
          if (job.details?.message) {
            this.polledJobMessage.set(job.details.message);
          }
        }),
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
          const isSuccess =
            status === 'SUCCESS' ||
            status === 'COMPLETED' ||
            (job.progress ?? 0) >= 100;
          const isFailed =
            status === 'FAILED' ||
            status === 'FAILURE' ||
            status === 'ERROR';

          if (isSuccess) {
            this.stopJobPolling();
            this.notificationsService.refetch();
            this.projectState.refreshSteps();
            this.loadState(projectId, false, true);
          } else if (isFailed) {
            this.stopJobPolling();
            this.notificationsService.refetch();
            const errorMsg =
              job.details?.error_log ||
              job.details?.message ||
              'Falha ao processar a correção de viés.';
            toast.error(errorMsg);
            this.loadState(projectId, false, false);
          }
        },
        error: (err) => {
          console.error('[FutureScenarios] Erro no polling do job:', err);
          this.stopJobPolling();
        },
      });
  }

  private stopJobPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.isPolling.set(false);
    this.polledJobProgress.set(null);
    this.polledJobMessage.set(null);
  }

  private syncSelectorsFromState(res: FutureScenariosStateResponse): void {
    const applied = res.result?.applied_params;
    const params = res.params;
    const source = applied ?? (res.ui_state === 'PROCESSING' ? params : null);

    if (source?.method) {
      this.selectedMethod.set(source.method);
    } else if (!this.selectedMethod()) {
      this.selectedMethod.set('EQM');
    }

    const model = source?.model ?? params?.model;
    if (model) {
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
