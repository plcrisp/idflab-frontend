import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { GlobalStats } from '../../shared/models/analysis.models';
import { SkeletonLoadingCoordinator, trackWithSkeleton } from '../../../../core/utils/skeleton-loading-coordinator';
import { Subscription } from 'rxjs';
import { DisaggregationMethod } from './components/temporal-disaggregation-path-selector/temporal-disaggregation-path-selector';

@Component({
  selector: 'app-temporal-disaggregation',
  standalone: false,
  templateUrl: './temporal-disaggregation.html',
  styleUrl: './temporal-disaggregation.scss',
})
export class TemporalDisaggregation {
  private projectState = inject(ProjectStateService);
  private initialVisualizationService = inject(InitialVisualizationService);
  private destroyRef = inject(DestroyRef);

  readonly project = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

  readonly selectedMethod = signal<DisaggregationMethod>('cetesb');

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

  private summarySub: Subscription | null = null;
  private lastLoadedProjectId: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
    });

    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        untracked(() => {
          this.stats.set(null);
        });
        return;
      }

      untracked(() => {
        this.loadSummary(project.id);
      });
    });
  }

  private loadSummary(projectId: string): void {
    if (this.lastLoadedProjectId === projectId && this.stats()) {
      return;
    }
    this.lastLoadedProjectId = projectId;
    this.summarySub?.unsubscribe();
    this.summarySub = this.initialVisualizationService
      .getSummary(projectId)
      .pipe(trackWithSkeleton(this.summarySkeleton))
      .subscribe({
        next: (res) => {
          this.stats.set(res.stats);
        },
        error: (err) => {
          console.error('[TemporalDisaggregation] Erro ao carregar resumo da estação:', err);
          this.stats.set(null);
        },
      });
  }
}
