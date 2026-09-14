import { computed, DestroyRef, effect, inject, Injectable, signal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { toast } from '@spartan-ng/brain/sonner';

import { HttpResponse } from '@angular/common/http';
import { Project } from '../../../../../core/models/api/project.model';
import { ProjectStateService } from '../../../services/project-state.service';
import { InitialVisualizationService } from '../../../services/initial-visualization.service';
import { FileDownloadService } from '../../../../../core/services/utils/file-download.service';
import {
  DetailResponse,
  GlobalStats,
  YearlySummaryItem,
} from '../models/initial-visualization.model';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../../core/utils/skeleton-loading-coordinator';
import {
  findRecordYear,
  getRecordsLabel,
  isFullYearWindow,
} from '../utils/initial-visualization.utils';

@Injectable()
export class InitialVisualizationStateService {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private fileDownloadService = inject(FileDownloadService);
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
  private lastProjectId: string | null = null;

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
      this.hasInitialLoaded.set(false);
      this.initialSkeleton.start();
    }),
    switchMap(([project]) =>
      this.initialVisualizationService.getSummary(project.id).pipe(
        map((summary) => ({ projectId: project.id, summary, error: false })),
        catchError((err) => {
          console.error('[InitialVisualizationState] erro ao buscar summary:', err);
          this.hasInitialLoaded.set(true);
          this.initialSkeleton.finish();
          return of({ projectId: project.id, summary: null, error: true });
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly summaryResponse = toSignal(this.summary$, { initialValue: null });

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
    const recordYear = findRecordYear(summary.yearly_summary);
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
    return findRecordYear(summary);
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
            console.error('[InitialVisualizationState] erro ao buscar detail:', err);
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

  readonly recordsLabel = computed(() => {
    const p = this.project();
    return getRecordsLabel(p?.station.resolution);
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
    // Reset de estado quando o projeto muda
    effect(() => {
      const project = this.project();
      if (!project) {
        this.resetState();
        return;
      }

      if (this.lastProjectId !== project.id) {
        this.lastProjectId = project.id;
        this.resetState();
      }
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

    // Reset de skeletons quando job está rodando ou dados são insuficientes
    effect(() => {
      if (this.isJobRunning() || this.hasInsufficientData()) {
        this.initialSkeleton.reset();
        this.detailSkeleton.reset();
      }
    });
  }

  private resetState(): void {
    this.hasInitialLoaded.set(false);
    this.initialSkeleton.reset();
    this.initialSkeleton.start();
    this.detailSkeleton.reset();
    this.manualWindow.set(null);
    this.manualSelectedYear.set(null);
  }

  selectYear(year: number): void {
    this.manualWindow.set([`${year}-01-01T00:00:00`, `${year}-12-31T00:00:00`]);
    this.manualSelectedYear.set(year);
  }

  selectRange([start, end]: [string, string]): void {
    this.manualWindow.set([start, end]);

    if (isFullYearWindow(start, end)) {
      this.manualSelectedYear.set(Number(start.slice(0, 4)));
    } else {
      this.manualSelectedYear.set(null);
    }
  }

  downloadRawSeries(): void {
    const project = this.project();
    if (!project) return;

    this.isDownloadingRawSeries.set(true);

    this.initialVisualizationService
      .downloadRawSeries(project.id)
      .pipe(finalize(() => this.isDownloadingRawSeries.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(response, `precipitacao_${project.id}.csv`);
          } catch (err) {
            console.error('[InitialVisualizationState] erro ao processar arquivo baixado:', err);
            toast.error('Não foi possível baixar a série bruta. Arquivo vazio.', {
              duration: 8000,
              position: 'bottom-center',
            });
          }
        },
        error: (err: unknown) => {
          console.error('[InitialVisualizationState] erro ao baixar série bruta:', err);
          toast.error('Não foi possível baixar a série bruta. Tente novamente.', {
            duration: 8000,
            position: 'bottom-center',
          });
        },
      });
  }
}
