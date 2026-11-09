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
import { Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { FutureScenariosService } from '../../services/future-scenarios.service';
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
  FutureScenariosStateResponse,
  SspScenario,
} from './models/future-scenarios.model';
import { getDistributionConfig } from '../distribution/constants/statistical-distribution.constants';
import { DistributionEnum } from '../distribution/models/statistical-distribution.model';

export interface BiasMethodCardOption {
  value: BiasCorrectionMethod;
  title: string;
  description: string;
  icon: string;
}

export type PeriodPreset = '2041-2070' | '2071-2100' | 'custom';

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
  private readonly destroyRef = inject(DestroyRef);

  private summarySub: Subscription | null = null;
  private stateSub: Subscription | null = null;
  private applySub: Subscription | null = null;

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

  readonly isBlocked = computed<boolean>(() => this.state()?.ui_state === 'BLOCKED');

  readonly isProcessing = computed<boolean>(
    () => this.isApplying() || this.state()?.ui_state === 'PROCESSING',
  );

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
    this.applySub?.unsubscribe();

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
        next: () => {
          this.isApplying.set(false);
          this.loadState(project.id, false);
        },
        error: (err) => {
          this.isApplying.set(false);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível iniciar a correção de viés. Tente novamente.';
          toast.error(msg);
        },
      });
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
    this.stateSub?.unsubscribe();
    this.applySub?.unsubscribe();
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'historical-idf']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'resultados']);
  }

  private syncSelectorsFromState(res: FutureScenariosStateResponse): void {
    const applied = res.result?.applied_params;
    const params = res.params;
    const source = applied ?? (res.ui_state === 'PROCESSING' ? params : null);

    if (source?.method) {
      this.selectedMethod.set(source.method);
    } else {
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
