import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, map, shareReplay, combineLatestWith } from 'rxjs/operators';
import { of } from 'rxjs';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { Project } from '../../../../core/models/api/project.model';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { GlobalStats, YearlySummaryItem } from './models/initial-visualization.model';

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

  private readonly selectedWindow = signal<[string, string] | null>(null);
  private selectedWindow$ = toObservable(this.selectedWindow);

  private static readonly FALLBACK_WINDOW: [string, string] = [
    '2026-01-01T00:00:00',
    '2026-01-31T00:00:00',
  ];

  readonly activeWindow: Signal<[string, string]> = toSignal(
    this.selectedWindow$.pipe(
      combineLatestWith(toObservable(this.defaultWindow)),
      map(([selected, defaultW]) => selected ?? defaultW ?? InitialVisualization.FALLBACK_WINDOW),
    ),
    { initialValue: InitialVisualization.FALLBACK_WINDOW },
  );

  readonly detail: Signal<any | null> = toSignal(
    this.summary$.pipe(
      filter((res): res is { projectId: string; summary: any } => !!res),
      combineLatestWith(this.selectedWindow$),
      switchMap(([{ projectId, summary }, selected]) => {
        const window = selected ?? summary.default_window;
        if (!window) return of(null);

        const [rawStart, rawEnd] = window;
        const start = rawStart.slice(0, 10);
        const end = rawEnd.slice(0, 10);

        return this.initialVisualizationService.getDetail(projectId, start, end).pipe(
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

      this.selectedWindow.set(null);

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `app/project/${project.id}` },
        { label: 'Visualização Inicial', url: `/app/analysis/${project.id}/initial-view` },
      ]);
    });
  }

  onWindowChange(window: [string, string]): void {
    this.selectedWindow.set(window);
  }

  protected get recordsLabel(): string {
    return this.project()?.station.resolution === 'daily'
      ? 'registros diários'
      : 'registros horários';
  }
}
