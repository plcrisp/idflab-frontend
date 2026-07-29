import { Component, effect, inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { Project } from '../../../../core/models/api/project.model';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { GlobalStats } from '../../models/initial-visualization.model';

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

  readonly stats: Signal<GlobalStats | null> = toSignal(
    this.project$.pipe(
      filter((project): project is Project => !!project),
      switchMap((project) =>
        this.initialVisualizationService.getSummary(project.id).pipe(
          tap((summary) => {
            console.log('[InitialVisualization] summary:', summary);
            this.loadDetail(project.id, summary);
          }),
          map((summary) => summary.stats),
          catchError((err) => {
            console.error('[InitialVisualization] erro ao buscar summary:', err);
            return of(null);
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `app/project/${project.id}` },
        { label: 'Visualização Inicial', url: `/app/analysis/${project.id}/initial-view` },
      ]);
    });
  }

  private loadDetail(projectId: string, summary: any): void {
    if (!summary?.default_window) {
      console.warn(
        '[InitialVisualization] default_window ausente na resposta do summary, pulando getDetail.',
      );
      return;
    }

    const [rawStart, rawEnd] = summary.default_window;
    const start = rawStart.slice(0, 10);
    const end = rawEnd.slice(0, 10);

    this.initialVisualizationService.getDetail(projectId, start, end).subscribe({
      next: (detail) => console.log('[InitialVisualization] detail:', detail),
      error: (err) => console.error('[InitialVisualization] erro ao buscar detail:', err),
    });
  }
}
