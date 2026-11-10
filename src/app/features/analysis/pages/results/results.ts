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
import { HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { FileDownloadService } from '../../../../core/services/utils/file-download.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { ResultsService } from '../../services/results.service';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';
import { isSubDailyResolution } from '../../../../core/utils/resolution.utils';
import { GlobalStats } from '../../shared/models/analysis.models';
import { ResultsResponse } from './models/results.model';
import { HistoricalIdfResponse } from '../historical-idf/models/historical-idf.model';
import {
  getDistributionColor,
  getDistributionConfig,
} from '../distribution/constants/statistical-distribution.constants';
import { getDistributionFormalName } from '../historical-idf/constants/historical-idf.constants';

@Component({
  selector: 'app-results',
  standalone: false,
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit, OnDestroy {
  private readonly mainLayoutService = inject(MainLayoutService);
  private readonly projectState = inject(ProjectStateService);
  private readonly router = inject(Router);
  private readonly initialVisualizationService = inject(InitialVisualizationService);
  private readonly resultsService = inject(ResultsService);
  private readonly fileDownloadService = inject(FileDownloadService);
  private readonly destroyRef = inject(DestroyRef);

  private summarySub: Subscription | null = null;
  private resultsSub: Subscription | null = null;

  private readonly summarySkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  private readonly resultsSkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly isSummaryLoading = computed<boolean>(() => this.summarySkeleton.showSkeleton());
  readonly isResultsLoading = computed<boolean>(() => this.resultsSkeleton.showSkeleton());

  readonly project = this.projectState.project;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly isHourly = computed<boolean>(() =>
    isSubDailyResolution(this.project()?.station?.resolution),
  );

  readonly stats = signal<GlobalStats | null>(null);
  readonly resultsData = signal<ResultsResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isDownloadingCsv = signal<boolean>(false);

  readonly activeView = signal<'curves' | 'intensity' | 'variation'>('curves');
  readonly chartScale = signal<'log' | 'linear'>('linear');

  private lastLoadedProjectId: string | null = null;

  readonly distributionName = computed<string>(() => {
    const data = this.resultsData();
    if (!data?.distribution) return '';
    return getDistributionConfig(data.distribution).name;
  });

  readonly distributionFullName = computed<string>(() => {
    const data = this.resultsData();
    if (!data?.distribution) return '';
    return getDistributionFormalName(data.distribution);
  });

  readonly distributionColor = computed<string>(() => {
    const data = this.resultsData();
    if (!data?.distribution) return '';
    return getDistributionColor(data.distribution);
  });

  readonly historicalChartData = computed<HistoricalIdfResponse | null>(() => {
    const d = this.resultsData();
    if (!d) return null;
    return {
      project_id: d.project_id,
      step_id: d.step_id,
      status: d.status,
      distribution: d.distribution,
      return_periods: d.return_periods,
      durations: d.durations,
      k: d.historical_idf.k,
      m: d.historical_idf.m,
      n: d.historical_idf.n,
      t0: d.historical_idf.t0,
      r2: d.historical_idf.r2,
      max_error: d.historical_idf.max_error,
      quantiles_mm_h: d.historical_idf.quantiles_mm_h,
      equation_mm_h: d.historical_idf.equation_mm_h,
      relative_error: d.historical_idf.relative_error,
      flags: d.historical_idf.flags,
      dense_grid: d.historical_dense_grid,
    };
  });

  readonly futureTableData = computed<HistoricalIdfResponse | null>(() => {
    const d = this.resultsData();
    if (!d) return null;
    return {
      project_id: d.project_id,
      step_id: d.step_id,
      status: d.status,
      distribution: d.distribution,
      return_periods: d.return_periods,
      durations: d.durations,
      k: d.future_idf.k,
      m: d.future_idf.m,
      n: d.future_idf.n,
      t0: d.future_idf.t0,
      r2: d.future_idf.r2,
      max_error: d.future_idf.max_error,
      quantiles_mm_h: d.future_idf.quantiles_mm_h,
      equation_mm_h: d.intensity_table_mm_h ?? d.future_idf.equation_mm_h,
      relative_error: d.future_idf.relative_error,
      flags: d.future_idf.flags,
      dense_grid: d.future_dense_grid,
    };
  });

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Resultados', url: `/app/analysis/${project.id}/resultados` },
      ]);

      if (this.lastLoadedProjectId !== project.id) {
        this.lastLoadedProjectId = project.id;
        untracked(() => {
          this.loadSummaryStats(project.id);
          this.loadResults(project.id);
        });
      }
    });
  }

  ngOnInit(): void {
    const p = this.project();
    if (p && this.lastLoadedProjectId !== p.id) {
      this.lastLoadedProjectId = p.id;
      this.loadSummaryStats(p.id);
      this.loadResults(p.id);
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
          console.error('[Results] Erro ao carregar estatísticas do resumo:', err);
          this.stats.set(null);
        },
      });
  }

  loadResults(projectId: string): void {
    this.resultsSub?.unsubscribe();
    this.errorMessage.set(null);

    this.resultsSub = this.resultsService
      .getResults(projectId)
      .pipe(trackWithSkeleton(this.resultsSkeleton))
      .subscribe({
        next: (data) => {
          this.resultsData.set(data);
          this.errorMessage.set(null);

          const proj = this.project();
          if (proj && proj.furthest_step !== 'RESULTS') {
            this.projectState.setProject({
              ...proj,
              furthest_step: 'RESULTS',
            });
          }
          this.projectState.refreshSteps().subscribe();
        },
        error: (err) => {
          console.error('[Results] Erro ao carregar resultados da IDF futura:', err);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível carregar os resultados da IDF futura. Verifique se a etapa de Cenários Futuros foi concluída.';
          this.errorMessage.set(msg);
        },
      });
  }

  onRetry(): void {
    const p = this.project();
    if (p) {
      this.loadResults(p.id);
    }
  }

  onDownloadCsv(): void {
    const p = this.project();
    if (!p || this.isDownloadingCsv()) return;

    this.isDownloadingCsv.set(true);

    this.resultsService
      .downloadCsv(p.id, ';')
      .pipe(finalize(() => this.isDownloadingCsv.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `idflab_resultados_${p.id}.csv`,
            );
          } catch (err) {
            console.error('[Results] Erro ao processar arquivo CSV baixado:', err);
            toast.error('Não foi possível baixar o CSV. Arquivo inválido.');
          }
        },
        error: (err) => {
          console.error('[Results] Erro ao exportar CSV dos resultados:', err);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível exportar o CSV de resultados. Tente novamente.';
          toast.error(msg);
        },
      });
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
    this.resultsSub?.unsubscribe();
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'cenarios-futuros']);
  }

  onFinish(): void {
    this.router.navigate(['/app/projects']);
  }
}
