import { Component, computed, DestroyRef, effect, inject, signal, Signal } from '@angular/core';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { Project } from '../../../../core/models/api/project.model';
import { GlobalStats } from '../../shared/models/analysis.models';
import {
  SkeletonLoadingCoordinator,
  trackWithSkeleton,
} from '../../../../core/utils/skeleton-loading-coordinator';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly stats = signal<GlobalStats | null>(null);

  private readonly summarySkeleton = new SkeletonLoadingCoordinator({
    delayMs: 350,
    minDurationMs: 250,
    destroyRef: this.destroyRef,
  });

  readonly isHourly = computed<boolean>(
    () => this.project()?.station?.resolution === 'hourly',
  );

  readonly isLoading = computed<boolean>(
    () => this.isJobRunning() || this.summarySkeleton.showSkeleton(),
  );

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `/app/project/${project.id}` },
        { label: 'Verificação de Consistência', url: `/app/analysis/${project.id}/consistency-check` },
      ]);
    });

    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        this.stats.set(null);
        return;
      }

      this.initialVisualizationService
        .getSummary(project.id)
        .pipe(trackWithSkeleton(this.summarySkeleton))
        .subscribe({
          next: (res) => {
            this.stats.set(res?.stats ?? null);
          },
          error: (err) => {
            console.error('Erro ao buscar estatísticas para consistência:', err);
            this.stats.set(null);
          },
        });
    });
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'initial-view']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'tratamento-de-falhas']);
  }
}
