import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, map, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { Router } from '@angular/router';

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
  private mapService = inject(MapService);
  private router = inject(Router);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

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
    switchMap(([project]) =>
      this.initialVisualizationService.getSummary(project.id).pipe(
        map((summary) => ({ projectId: project.id, summary, error: false })),
        catchError((err) => {
          console.error('[InitialVisualization] erro ao buscar summary:', err);
          return of({ projectId: project.id, summary: null, error: true });
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly summaryResponse = toSignal(this.summary$, { initialValue: null });

  readonly stats: Signal<GlobalStats | null> = computed(
    () => this.summaryResponse()?.summary?.stats ?? null,
  );

  readonly defaultWindow: Signal<[string, string] | null> = computed(
    () => this.summaryResponse()?.summary?.default_window ?? null,
  );

  readonly yearlySummary: Signal<YearlySummaryItem[]> = computed(
    () => this.summaryResponse()?.summary?.yearly_summary ?? [],
  );

  private readonly manualWindow = signal<[string, string] | null>(null);

  readonly selectedYear = signal<number | null>(null);

  readonly activeWindow: Signal<[string, string] | null> = computed(
    () => this.manualWindow() ?? this.defaultWindow(),
  );

  private activeWindow$ = toObservable(this.activeWindow);

  private detailTrigger$ = combineLatest([this.project$, this.activeWindow$]).pipe(
    filter((pair): pair is [Project, [string, string]] => !!pair[0] && !!pair[1]),
  );

  readonly detail: Signal<DetailResponse | null> = toSignal(
    this.detailTrigger$.pipe(
      switchMap(([project, window]) => {
        if (this.isJobRunning() || this.hasInsufficientData()) {
          return of(null);
        }

        const [rawStart, rawEnd] = window;
        const start = rawStart.slice(0, 10);
        const end = rawEnd.slice(0, 10);

        return this.initialVisualizationService.getDetail(project.id, start, end).pipe(
          catchError((err) => {
            console.error('[InitialVisualization] erro ao buscar detail:', err);
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null },
  );

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
      if (!project) return;

      this.manualWindow.set(null);
      this.selectedYear.set(null);

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
      if (res) {
        const hasNoData =
          !res.summary ||
          !res.summary.stats ||
          res.summary.stats.total_records === 0;
        this.projectState.setInsufficientData(hasNoData);
      }
    });

    effect(() => {
      const summary = this.yearlySummary();
      if (summary.length === 0) return;

      const recordYear = this.findRecordYear(summary);
      if (recordYear !== null) {
        this.onYearSelected(recordYear);
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
    return this.project()?.station.resolution === 'daily'
      ? 'registros diários'
      : 'registros horários';
  }

  // ao clicar em um ano no gráfico superior
  onYearSelected(year: number): void {
    this.manualWindow.set([`${year}-01-01T00:00:00`, `${year}-12-31T00:00:00`]);
    this.selectedYear.set(year);
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
      this.selectedYear.set(Number(startYear));
    } else {
      this.selectedYear.set(null);
    }
  }

  onBackToMap(): void {
    const stationId = this.project()?.station_id;
    this.router.navigateByUrl('/app/interactive-map').then((navigated) => {
      if (navigated && stationId) {
        this.mapService.selectStation(stationId);
      }
    });
  }
}
