import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, map, shareReplay } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { Project } from '../../../../core/models/api/project.model';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
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

  readonly project: Signal<Project | null> = this.projectState.project;

  private project$ = toObservable(this.project);

  private summary$ = this.project$.pipe(
    filter((project): project is Project => !!project),
    switchMap((project) =>
      this.initialVisualizationService.getSummary(project.id).pipe(
        map((summary) => ({ projectId: project.id, summary })),
        catchError((err) => {
          console.error('[InitialVisualization] erro ao buscar summary:', err);
          return of(null);
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly stats: Signal<GlobalStats | null> = toSignal(
    this.summary$.pipe(map((res) => res?.summary.stats ?? null)),
    { initialValue: null },
  );

  readonly defaultWindow: Signal<[string, string] | null> = toSignal(
    this.summary$.pipe(map((res) => res?.summary.default_window ?? null)),
    { initialValue: null },
  );

  readonly yearlySummary: Signal<YearlySummaryItem[]> = toSignal(
    this.summary$.pipe(map((res) => res?.summary.yearly_summary ?? [])),
    { initialValue: [] },
  );

  /**
   * Drill-down: quando o usuário clica em uma barra do gráfico anual,
   * guardamos aqui a janela daquele ano. Enquanto for `null`, a série
   * detalhada usa a `defaultWindow` vinda do summary.
   */
  private readonly manualWindow = signal<[string, string] | null>(null);

  /** Ano do drill-down ativo (bate com `manualWindow`), usado para destacar a barra no gráfico anual. */
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

    effect(() => {
      const summary = this.yearlySummary();
      if (summary.length === 0 || this.selectedYear() !== null) return;

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
}
