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
import { Subscription } from 'rxjs';
import { SkeletonLoadingCoordinator, trackWithSkeleton } from '../../../../core/utils/skeleton-loading-coordinator';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { StatisticalDistributionService } from '../../services/statistical-distribution.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { isSubDailyResolution } from '../../../../core/utils/resolution.utils';
import { GlobalStats } from '../../shared/models/analysis.models';
import {
  DistributionEnum,
  DistributionStateResponse,
  DurationDetailResponse,
} from './models/statistical-distribution.model';
import { getDistributionConfig } from './constants/statistical-distribution.constants';

@Component({
  selector: 'app-distribution',
  standalone: false,
  templateUrl: './distribution.html',
  styleUrl: './distribution.scss',
})
export class Distribution implements OnInit, OnDestroy {
  private readonly mainLayoutService = inject(MainLayoutService);
  private readonly projectState = inject(ProjectStateService);
  private readonly router = inject(Router);
  private readonly distributionService = inject(StatisticalDistributionService);
  private readonly initialVisualizationService = inject(InitialVisualizationService);
  private readonly destroyRef = inject(DestroyRef);

  private summarySub: Subscription | null = null;
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
  readonly state = signal<DistributionStateResponse | null>(null);
  readonly selectedDuration = signal<number | null>(null);
  readonly currentDurationDetail = signal<DurationDetailResponse | null>(null);
  readonly selectedDistribution = signal<DistributionEnum | null>(null);
  readonly suggestedDistribution = signal<DistributionEnum | null>(null);

  readonly activeView = signal<'chart' | 'table'>('chart');
  readonly isLoadingState = signal<boolean>(true);
  readonly isLoadingDurationDetail = signal<boolean>(false);
  readonly isSavingSelection = signal<boolean>(false);
  readonly isAdvancing = signal<boolean>(false);

  private readonly durationCache = new Map<number, DurationDetailResponse>();
  private lastLoadedProjectId: string | null = null;

  readonly currentDurationLabel = computed<string>(() => {
    const detail = this.currentDurationDetail();
    if (detail) return detail.duration_label;

    const durMin = this.selectedDuration();
    if (!durMin) return '-';

    const match = this.state()?.available_durations?.find((d) => d.duration_minutes === durMin);
    return match?.label ?? (durMin < 60 ? `${durMin} min` : `${durMin / 60} h`);
  });

  readonly selectedDistributionName = computed<string>(() => {
    const code = this.selectedDistribution();
    if (!code) return '';
    return getDistributionConfig(code).name;
  });

  readonly disaggregationMethodLabel = computed<string | null>(() => {
    const method = this.state()?.disaggregation?.method;
    if (!method) return null;
    const m = method.toUpperCase();
    if (m.includes('BARTLETT')) return 'Bartlett-Lewis';
    if (m.includes('CETESB')) return 'CETESB';
    if (m.includes('DIRECT') || m.includes('AGREGACAO')) return 'Agregação direta';
    return method;
  });

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Distribuição Estatística', url: `/app/analysis/${project.id}/distribution` },
      ]);

      if (this.lastLoadedProjectId !== project.id) {
        this.lastLoadedProjectId = project.id;
        untracked(() => {
          this.loadSummaryStats(project.id);
          this.loadState(project.id);
        });
      }
    });
  }

  ngOnInit(): void {
    const p = this.project();
    if (p && this.lastLoadedProjectId !== p.id) {
      this.lastLoadedProjectId = p.id;
      this.loadSummaryStats(p.id);
      this.loadState(p.id);
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
          console.error('[Distribution] Erro ao carregar estatísticas do resumo:', err);
          this.stats.set(null);
        },
      });
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
  }

  loadState(projectId: string): void {
    this.isLoadingState.set(true);

    this.distributionService.getState(projectId).subscribe({
      next: (resp) => {
        if (resp.status === 'PENDING') {
          // Primeira entrada ou invalidado: dispara ajuste síncrono
          this.runFit(projectId);
        } else {
          this.handleStateLoaded(resp);
        }
      },
      error: (err) => {
        console.error('[Distribution] Erro ao buscar /state:', err);
        // Tenta rodar fit caso não exista estado
        this.runFit(projectId);
      },
    });
  }

  runFit(projectId: string): void {
    this.distributionService.fit(projectId).subscribe({
      next: (resp) => {
        this.handleStateLoaded(resp);
      },
      error: (err) => {
        console.error('[Distribution] Erro ao executar /fit:', err);
        this.isLoadingState.set(false);
        const msg = err?.error?.detail ?? 'Não foi possível ajustar as distribuições estatísticas.';
        toast.error(msg);
      },
    });
  }

  private handleStateLoaded(resp: DistributionStateResponse): void {
    this.state.set(resp);
    this.isLoadingState.set(false);

    // Distribuição sugerida
    this.suggestedDistribution.set(resp.suggested_distribution ?? null);

    // Distribuição selecionada (mantém seleção salva ou adota a sugerida por padrão)
    if (resp.selection?.selected_distribution) {
      this.selectedDistribution.set(resp.selection.selected_distribution);
    } else if (resp.suggested_distribution) {
      this.selectedDistribution.set(resp.suggested_distribution);
    }

    // Duração selecionada: padrão 60 min (1 h) se existir, senão a primeira
    const durs = resp.available_durations ?? [];
    const defaultDur = durs.find((d) => d.duration_minutes === 60) ?? durs[0] ?? null;

    if (defaultDur) {
      this.selectDuration(defaultDur.duration_minutes);
    }
  }

  selectDuration(durationMinutes: number): void {
    this.selectedDuration.set(durationMinutes);

    const cached = this.durationCache.get(durationMinutes);
    if (cached) {
      this.currentDurationDetail.set(cached);
      return;
    }

    const p = this.project();
    if (!p) return;

    this.isLoadingDurationDetail.set(true);

    this.distributionService.getDurationDetail(p.id, durationMinutes).subscribe({
      next: (detail) => {
        this.durationCache.set(durationMinutes, detail);
        this.currentDurationDetail.set(detail);
        this.isLoadingDurationDetail.set(false);
      },
      error: (err) => {
        console.error('[Distribution] Erro ao carregar detalhe da duração:', err);
        this.isLoadingDurationDetail.set(false);
        const msg = err?.error?.detail ?? 'Não foi possível carregar os dados desta duração.';
        toast.error(msg);
      },
    });
  }

  onSelectDistribution(code: DistributionEnum): void {
    const p = this.project();
    if (!p || this.isSavingSelection()) return;

    const previous = this.selectedDistribution();
    if (previous === code) return;

    // Atualização otimista
    this.selectedDistribution.set(code);
    this.isSavingSelection.set(true);

    this.distributionService.saveSelection(p.id, code, 'manual').subscribe({
      next: (resp) => {
        this.isSavingSelection.set(false);
        this.selectedDistribution.set(resp.selected_distribution);
        toast.success(`Distribuição ${getDistributionConfig(code).name} selecionada.`);
      },
      error: (err) => {
        console.error('[Distribution] Erro ao salvar seleção de distribuição:', err);
        this.isSavingSelection.set(false);
        // Reverte estado local
        this.selectedDistribution.set(previous);
        const msg = err?.error?.detail ?? 'Não foi possível salvar a distribuição escolhida.';
        toast.error(msg);
      },
    });
  }

  onBack(): void {
    const project = this.project();
    if (!project || this.isAdvancing()) return;
    this.router.navigate(['/app/analysis', project.id, 'temporal-disaggregation']);
  }

  onAdvance(): void {
    const project = this.project();
    const selected = this.selectedDistribution();
    if (!project || !selected || this.isAdvancing() || this.isSavingSelection()) return;

    this.isAdvancing.set(true);

    this.projectState.updateFurthestStep('HISTORICAL_IDF').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'idf-historica']);
      },
      error: (err) => {
        this.isAdvancing.set(false);
        console.error('[Distribution] Erro ao avançar etapa:', err);
        this.router.navigate(['/app/analysis', project.id, 'idf-historica']);
      },
    });
  }
}
