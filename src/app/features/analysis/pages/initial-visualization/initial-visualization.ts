import { Component, computed, DestroyRef, effect, inject, signal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, map, shareReplay, distinctUntilChanged, finalize, tap } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { Router } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { Project } from '../../../../core/models/api/project.model';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { MapService } from '../../../../core/services/utils/map.service';
import {
  DetailResponse,
  GlobalStats,
  YearlySummaryItem,
} from './models/initial-visualization.model';
import { FileDownloadService } from '../../../../core/services/utils/file-download.service';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';

@Component({
  selector: 'app-initial-visualization',
  standalone: false,
  templateUrl: './initial-visualization.html',
  styleUrl: './initial-visualization.scss',
})
export class InitialVisualization {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private fileDownloadService = inject(FileDownloadService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;

  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;
  readonly isDownloadingRawSeries = signal(false);

  readonly hasInitialLoaded = signal(false);

  readonly initialSkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly detailSkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });


  readonly isInitialSkeleton = this.initialSkeleton.showSkeleton;
  readonly isAnnualSkeleton = this.initialSkeleton.showSkeleton;

  readonly isDetailSkeleton = computed<boolean>(() => {
    if (!this.hasInitialLoaded()) {
      return this.initialSkeleton.showSkeleton();
    }
    return this.detailSkeleton.showSkeleton();
  });

  private project$ = toObservable(this.project);
  private readonly refreshSummaryTrigger = signal<number>(0);
  private previousJobRunning = false;

  private summaryTrigger$ = combineLatest([
    this.project$,
    toObservable(this.refreshSummaryTrigger),
    toObservable(this.isJobRunning),
  ]).pipe(
    filter(
      (tuple): tuple is [Project, number, boolean] =>
        Boolean(tuple[0]) && !tuple[2],
    ),
    distinctUntilChanged(
      (prev, curr) => prev[0].id === curr[0].id && prev[1] === curr[1],
    ),
  );

  private summary$ = this.summaryTrigger$.pipe(
    tap(() => {
      // Início do carregamento inicial da página
      this.hasInitialLoaded.set(false);
      this.initialSkeleton.start();
    }),
    switchMap(([project]) =>
      this.initialVisualizationService.getSummary(project.id).pipe(
        map((summary) => ({ projectId: project.id, summary, error: false })),
        catchError((err) => {
          console.error('[InitialVisualization] erro ao buscar summary:', err);
          this.hasInitialLoaded.set(true);
          this.initialSkeleton.finish();
          return of({ projectId: project.id, summary: null, error: true });
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly summaryResponse = toSignal(this.summary$, { initialValue: null });

  private lastProjectId: string | null = null;

  readonly stats: Signal<GlobalStats | null> = computed(() => {
    const p = this.project();
    const res = this.summaryResponse();
    if (!p || !res || res.projectId !== p.id) {
      return null;
    }
    return res.summary?.stats ?? null;
  });

  readonly yearlySummary: Signal<YearlySummaryItem[]> = computed(() => {
    const p = this.project();
    const res = this.summaryResponse();
    if (!p || !res || res.projectId !== p.id) {
      return [];
    }
    return res.summary?.yearly_summary ?? [];
  });

  readonly defaultWindow: Signal<[string, string] | null> = computed(() => {
    const p = this.project();
    const res = this.summaryResponse();
    if (!p || !res || res.projectId !== p.id) {
      return null;
    }
    const summary = res.summary;
    if (!summary) return null;
    const recordYear = this.findRecordYear(summary.yearly_summary);
    if (recordYear !== null) {
      return [`${recordYear}-01-01T00:00:00`, `${recordYear}-12-31T00:00:00`];
    }
    return summary.default_window ?? null;
  });

  private readonly manualWindow = signal<[string, string] | null>(null);
  private readonly manualSelectedYear = signal<number | null>(null);

  readonly selectedYear: Signal<number | null> = computed(() => {
    const manual = this.manualSelectedYear();
    if (manual !== null) return manual;
    const summary = this.yearlySummary();
    if (!summary.length) return null;
    return this.findRecordYear(summary);
  });

  readonly activeWindow: Signal<[string, string] | null> = computed(
    () => this.manualWindow() ?? this.defaultWindow(),
  );

  private activeWindow$ = toObservable(this.activeWindow);

  private detailTrigger$ = combineLatest([this.project$, this.activeWindow$]).pipe(
    filter((pair): pair is [Project, [string, string]] => !!pair[0] && !!pair[1]),
    distinctUntilChanged(
      (prev, curr) =>
        prev[0].id === curr[0].id &&
        prev[1][0] === curr[1][0] &&
        prev[1][1] === curr[1][1],
    ),
  );

  private readonly detailResponse = toSignal(
    this.detailTrigger$.pipe(
      switchMap(([project, window]) => {
        if (this.isJobRunning() || this.hasInsufficientData()) {
          this.initialSkeleton.reset();
          this.detailSkeleton.reset();
          return of({ projectId: project.id, detail: null });
        }

        const [rawStart, rawEnd] = window;
        const start = rawStart.slice(0, 10);
        const end = rawEnd.slice(0, 10);

        const isInitial = !this.hasInitialLoaded();

        const req$ = this.initialVisualizationService.getDetail(project.id, start, end).pipe(
          map((detail) => ({ projectId: project.id, detail })),
          tap(() => {
            if (isInitial) {
              this.hasInitialLoaded.set(true);
              this.initialSkeleton.finish();
            }
          }),
          catchError((err) => {
            console.error('[InitialVisualization] erro ao buscar detail:', err);
            if (isInitial) {
              this.hasInitialLoaded.set(true);
              this.initialSkeleton.finish();
            }
            return of({ projectId: project.id, detail: null });
          }),
        );

        return isInitial ? req$ : req$.pipe(trackWithSkeleton(this.detailSkeleton));
      }),
    ),
    { initialValue: null },
  );

  readonly detail: Signal<DetailResponse | null> = computed(() => {
    const p = this.project();
    const res = this.detailResponse();
    if (!p || !res || res.projectId !== p.id) {
      return null;
    }
    return res.detail;
  });

  readonly isAdvanceDisabled = computed(() => {
    return this.isJobRunning() || this.hasInsufficientData();
  });

  readonly advanceTooltip = computed(() => {
    if (this.isJobRunning()) {
      return 'Aguardando conclusão da busca de dados';
    }
    if (this.hasInsufficientData()) {
      return 'Não é possível avançar sem dados suficientes';
    }
    return '';
  });

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) {
        this.lastProjectId = null;
        this.hasInitialLoaded.set(false);
        this.initialSkeleton.reset();
        this.initialSkeleton.start();
        this.detailSkeleton.reset();
        this.manualWindow.set(null);
        this.manualSelectedYear.set(null);
        return;
      }

      if (this.lastProjectId !== project.id) {
        this.lastProjectId = project.id;
        this.hasInitialLoaded.set(false);
        this.initialSkeleton.reset();
        this.initialSkeleton.start();
        this.detailSkeleton.reset();
        this.manualWindow.set(null);
        this.manualSelectedYear.set(null);
      }

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `app/project/${project.id}` },
        { label: 'Visualização Inicial', url: `/app/analysis/${project.id}/initial-view` },
      ]);
    });

    // Detecta transição de job ativo para finalizado sem exigir reload manual
    effect(() => {
      const running = this.isJobRunning();
      const p = this.project();
      if (this.previousJobRunning && !running && p) {
        this.projectState.loadProject(p.id);
        this.refreshSummaryTrigger.update((v) => v + 1);
      }
      this.previousJobRunning = running;
    });

    // Atualiza estado de dados insuficientes
    effect(() => {
      if (this.isJobRunning()) {
        this.projectState.setInsufficientData(false);
        return;
      }
      const res = this.summaryResponse();
      const p = this.project();
      if (res && p && res.projectId === p.id) {
        const hasNoData =
          !res.summary ||
          !res.summary.stats ||
          res.summary.stats.total_records === 0;
        this.projectState.setInsufficientData(hasNoData);
        if (hasNoData) {
          this.hasInitialLoaded.set(true);
          this.initialSkeleton.finish();
        }
      }
    });

    effect(() => {
      if (this.isJobRunning() || this.hasInsufficientData()) {
        this.initialSkeleton.reset();
        this.detailSkeleton.reset();
      }
    });
  }

  private findRecordYear(data: YearlySummaryItem[]): number | null {
    const best = data.reduce<YearlySummaryItem | null>((best, item) => {
      if (item.max_value === null) return best;
      if (!best || best.max_value === null || item.max_value > best.max_value) return item;
      return best;
    }, null);
    return best?.year ?? null;
  }

  protected get recordsLabel(): string {
    const p = this.project();
    if (!p) return '';
    return p.station.resolution === 'daily'
      ? 'registros diários'
      : 'registros horários';
  }

  // ao clicar em um ano no gráfico superior
  onYearSelected(year: number): void {
    this.manualWindow.set([`${year}-01-01T00:00:00`, `${year}-12-31T00:00:00`]);
    this.manualSelectedYear.set(year);
  }

  // ao selecionar um intervalo de datas pelo date range picker
  onRangeSelected([start, end]: [string, string]): void {
    this.manualWindow.set([start, end]);

    const startYear = start.slice(0, 4);
    const endYear = end.slice(0, 4);
    const isFullYear =
      startYear === endYear &&
      start.slice(5, 10) === '01-01' &&
      end.slice(5, 10) === '12-31';

    if (isFullYear) {
      this.manualSelectedYear.set(Number(startYear));
    } else {
      this.manualSelectedYear.set(null);
    }
  }

  onBackToMap(): void {
    const stationId = this.project()?.station_id || this.project()?.station?.id;
    if (stationId) {
      this.mapService.selectStation(stationId);
    }
    this.router.navigateByUrl('/app/interactive-map');
  }

  onDownloadRawSeries(): void {
    const project = this.project();
    if (!project) return;
 
    this.isDownloadingRawSeries.set(true);
 
    this.initialVisualizationService
      .downloadRawSeries(project.id)
      .pipe(finalize(() => this.isDownloadingRawSeries.set(false)))
      .subscribe({
        next: (response) => {
          try {
            this.fileDownloadService.triggerDownload(response, `precipitacao_${project.id}.csv`);
          } catch (err) {
            console.error('[InitialVisualization] erro ao processar arquivo baixado:', err);
            toast.error('Não foi possível baixar a série bruta. Arquivo vazio.', {
              duration: 8000,
              position: 'bottom-center',
            });
          }
        },
        error: (err) => {
          console.error('[InitialVisualization] erro ao baixar série bruta:', err);
          toast.error('Não foi possível baixar a série bruta. Tente novamente.', {
            duration: 8000,
            position: 'bottom-center',
          });
        },
      });
  }

  onAdvance(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'consistency-check']);
  }
}
