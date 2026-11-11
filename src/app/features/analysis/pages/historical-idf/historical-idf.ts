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
import { finalize, Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { FileDownloadService } from '../../../../core/services/utils/file-download.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { HistoricalIdfService } from '../../services/historical-idf.service';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';
import { isSubDailyResolution } from '../../../../core/utils/resolution.utils';
import { GlobalStats } from '../../shared/models/analysis.models';
import { HistoricalIdfResponse } from './models/historical-idf.model';
import {
  getDistributionColor,
  getDistributionConfig,
} from '../distribution/constants/statistical-distribution.constants';
import { getDistributionFormalName } from './constants/historical-idf.constants';
import { buildAnalysisBreadcrumbs } from '../../../../core/utils/project-step.utils';

@Component({
  selector: 'app-historical-idf',
  standalone: false,
  templateUrl: './historical-idf.html',
  styleUrl: './historical-idf.scss',
})
export class HistoricalIdf implements OnInit, OnDestroy {
  private readonly mainLayoutService = inject(MainLayoutService);
  private readonly projectState = inject(ProjectStateService);
  private readonly router = inject(Router);
  private readonly initialVisualizationService = inject(InitialVisualizationService);
  private readonly historicalIdfService = inject(HistoricalIdfService);
  private readonly fileDownloadService = inject(FileDownloadService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isDownloadingIdf = signal<boolean>(false);

  private summarySub: Subscription | null = null;
  private idfSub: Subscription | null = null;

  private readonly summarySkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  private readonly idfSkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly isSummaryLoading = computed<boolean>(() => this.summarySkeleton.showSkeleton());
  readonly isIdfLoading = computed<boolean>(() => this.idfSkeleton.showSkeleton());

  readonly project = this.projectState.project;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly isHourly = computed<boolean>(() =>
    isSubDailyResolution(this.project()?.station?.resolution),
  );

  readonly stats = signal<GlobalStats | null>(null);
  readonly idfData = signal<HistoricalIdfResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Toggles de visão unificada
  readonly activeView = signal<'curves' | 'intensity' | 'quantiles' | 'error'>('curves');
  readonly chartScale = signal<'log' | 'linear'>('linear');

  private lastLoadedProjectId: string | null = null;

  readonly distributionName = computed(() => {
    const data = this.idfData();
    if (!data?.distribution) return '';
    return getDistributionConfig(data.distribution).name;
  });

  readonly distributionFullName = computed(() => {
    const data = this.idfData();
    if (!data?.distribution) return '';
    return getDistributionFormalName(data.distribution);
  });

  readonly distributionColor = computed(() => {
    const data = this.idfData();
    if (!data?.distribution) return '';
    return getDistributionColor(data.distribution);
  });

  readonly maxErrorDurationLabel = computed(() => {
    const data = this.idfData();
    if (!data?.max_error) return '';
    const durMin = data.max_error.duration_minutes;
    const match = data.durations?.find((d) => d.duration_minutes === durMin);
    return match?.label ?? (durMin ? `${durMin} min` : '');
  });

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs(
        buildAnalysisBreadcrumbs(project, 'IDF Histórica', `/app/analysis/${project.id}/historical-idf`),
      );

      if (this.lastLoadedProjectId !== project.id) {
        this.lastLoadedProjectId = project.id;
        untracked(() => {
          this.loadSummaryStats(project.id);
          this.loadHistoricalIdf(project.id);
        });
      }
    });
  }

  ngOnInit(): void {
    const p = this.project();
    if (p && this.lastLoadedProjectId !== p.id) {
      this.lastLoadedProjectId = p.id;
      this.loadSummaryStats(p.id);
      this.loadHistoricalIdf(p.id);
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
          console.error('[HistoricalIdf] Erro ao carregar estatísticas do resumo:', err);
          this.stats.set(null);
        },
      });
  }

  loadHistoricalIdf(projectId: string): void {
    this.idfSub?.unsubscribe();
    this.errorMessage.set(null);

    this.idfSub = this.historicalIdfService
      .getHistoricalIdf(projectId)
      .pipe(trackWithSkeleton(this.idfSkeleton))
      .subscribe({
        next: (data) => {
          this.idfData.set(data);
          this.errorMessage.set(null);

          // Atualizar o estado global caso o furthest_step do projeto ainda não seja FUTURE_SCENARIOS
          const proj = this.project();
          if (proj && proj.furthest_step === 'HISTORICAL_IDF') {
            this.projectState.setProject({
              ...proj,
              furthest_step: 'FUTURE_SCENARIOS',
            });
          }
          this.projectState.refreshSteps().subscribe();
        },
        error: (err) => {
          console.error('[HistoricalIdf] Erro ao carregar IDF histórica:', err);
          const msg =
            err?.error?.message ??
            err?.error?.detail ??
            'Não foi possível carregar a IDF histórica. Verifique sua conexão e tente novamente.';
          this.errorMessage.set(msg);
        },
      });
  }

  onRetry(): void {
    const p = this.project();
    if (p) {
      this.loadHistoricalIdf(p.id);
    }
  }

  formatSignedPercentage(fraction: number | null | undefined): string {
    if (fraction == null || Number.isNaN(fraction)) return '0,0%';
    const pct = fraction * 100;
    const sign = pct > 0.0001 ? '+' : pct < -0.0001 ? '−' : '';
    const absFmt = Math.abs(pct).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${absFmt}%`;
  }

  ngOnDestroy(): void {
    this.summarySub?.unsubscribe();
    this.idfSub?.unsubscribe();
  }

  onDownloadHistoricalIdf(): void {
    const p = this.project();
    if (!p || this.isDownloadingIdf()) return;

    this.isDownloadingIdf.set(true);
    this.historicalIdfService
      .downloadHistoricalIdf(p.id, ';')
      .pipe(finalize(() => this.isDownloadingIdf.set(false)))
      .subscribe({
        next: (response) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `historical_idf_${p.id}.zip`,
            );
          } catch (err) {
            console.error('[HistoricalIdf] Erro ao processar download:', err);
            toast.error('Não foi possível baixar a IDF histórica.');
          }
        },
        error: (err) => {
          console.error('[HistoricalIdf] Erro ao baixar IDF histórica:', err);
          toast.error('Erro ao baixar IDF histórica. Tente novamente.');
        },
      });
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'distribution']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'cenarios-futuros']);
  }
}
