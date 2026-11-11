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
import { getDistributionColor } from '../distribution/constants/statistical-distribution.constants';
import { getDistributionFormalName } from '../historical-idf/constants/historical-idf.constants';
import { buildAnalysisBreadcrumbs } from '../../../../core/utils/project-step.utils';

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
  readonly isDownloadingResultsZip = signal<boolean>(false);
  readonly isDownloadingFullBundle = signal<boolean>(false);
  readonly isDownloadingCsv = this.isDownloadingResultsZip;

  private lastLoadedProjectId: string | null = null;

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

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs(
        buildAnalysisBreadcrumbs(project, 'Resultados', `/app/analysis/${project.id}/resultados`),
      );

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

  onDownloadResultsZip(): void {
    const p = this.project();
    if (!p || this.isDownloadingResultsZip()) return;

    this.isDownloadingResultsZip.set(true);

    this.resultsService
      .downloadResultsZip(p.id, ';')
      .pipe(finalize(() => this.isDownloadingResultsZip.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `idf_results_${p.id}.zip`,
            );
          } catch (err) {
            console.error('[Results] Erro ao processar arquivo ZIP baixado:', err);
            toast.error('Não foi possível baixar o ZIP de resultados. Arquivo inválido.');
          }
        },
        error: (err) => {
          console.error('[Results] Erro ao exportar ZIP dos resultados:', err);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível exportar os resultados. Tente novamente.';
          toast.error(msg);
        },
      });
  }

  onDownloadFullBundleZip(): void {
    const p = this.project();
    if (!p || this.isDownloadingFullBundle()) return;

    this.isDownloadingFullBundle.set(true);

    this.resultsService
      .downloadFullBundle(p.id, ';')
      .pipe(finalize(() => this.isDownloadingFullBundle.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `idflab_complete_project_${p.id}.zip`,
            );
          } catch (err) {
            console.error('[Results] Erro ao processar pacote completo baixado:', err);
            toast.error('Não foi possível baixar o pacote completo. Arquivo inválido.');
          }
        },
        error: (err) => {
          console.error('[Results] Erro ao exportar pacote completo:', err);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Não foi possível exportar o pacote completo do projeto. Tente novamente.';
          toast.error(msg);
        },
      });
  }

  onDownloadCsv(): void {
    this.onDownloadResultsZip();
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
