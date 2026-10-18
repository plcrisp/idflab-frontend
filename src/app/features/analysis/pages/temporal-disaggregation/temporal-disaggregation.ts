import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationService } from '../../services/initial-visualization.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { ProjectStepsService } from '../../../../core/services/api/project-steps.service';
import { TemporalDisaggregationService } from '../../services/temporal-disaggregation.service';
import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { GlobalStats } from '../../shared/models/analysis.models';
import { SkeletonLoadingCoordinator, trackWithSkeleton } from '../../../../core/utils/skeleton-loading-coordinator';
import { Subscription } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
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
  private stationService = inject(StationService);
  private projectStepsService = inject(ProjectStepsService);
  private disaggregationService = inject(TemporalDisaggregationService);
  private mainLayoutService = inject(MainLayoutService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly project = this.projectState.project;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;
  readonly isAdvancing = signal<boolean>(false);

  readonly selectedMethod = signal<DisaggregationMethod>('cetesb');
  readonly stats = signal<GlobalStats | null>(null);

  readonly hasCemadenNeighbors = signal<boolean>(false);
  readonly isCheckingCemaden = signal<boolean>(false);
  readonly isExecuting = signal<boolean>(false);
  readonly isCetesbExecuted = signal<boolean>(false);

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

  readonly isBartlettDisabled = computed<boolean>(
    () => !this.hasCemadenNeighbors() || this.isCheckingCemaden(),
  );

  private summarySub: Subscription | null = null;
  private cemadenSub: Subscription | null = null;
  private stepSub: Subscription | null = null;
  private lastLoadedProjectId: string | null = null;
  private lastCheckedStationId: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.summarySub?.unsubscribe();
      this.cemadenSub?.unsubscribe();
      this.stepSub?.unsubscribe();
    });

    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Resolução Temporal', url: `/app/analysis/${project.id}/temporal-disaggregation` },
      ]);
    });

    effect(() => {
      const project = this.project();
      const isJobRunning = this.isJobRunning();

      if (!project || isJobRunning) {
        untracked(() => {
          this.stats.set(null);
          this.hasCemadenNeighbors.set(false);
          this.isCheckingCemaden.set(false);
          this.isCetesbExecuted.set(false);
        });
        return;
      }

      untracked(() => {
        this.loadSummary(project.id);
        this.checkExistingStep(project.id);
        const stationId = project.station?.id ?? project.station_id;
        if (stationId) {
          this.checkCemadenCandidates(stationId);
        }
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

  private checkCemadenCandidates(stationId: string): void {
    if (this.lastCheckedStationId === stationId) {
      return;
    }
    this.lastCheckedStationId = stationId;
    this.cemadenSub?.unsubscribe();
    this.isCheckingCemaden.set(true);

    this.cemadenSub = this.stationService
      .getNeighborStations(stationId, { calibration_candidates: true })
      .subscribe({
        next: (candidates) => {
          const hasCandidates = candidates.length > 0;
          this.hasCemadenNeighbors.set(hasCandidates);
          this.isCheckingCemaden.set(false);

          if (!hasCandidates && this.selectedMethod() === 'bartlett-lewis') {
            this.selectedMethod.set('cetesb');
          }
        },
        error: (err) => {
          console.error('[TemporalDisaggregation] Erro ao buscar estações CEMADEN candidatas:', err);
          this.hasCemadenNeighbors.set(false);
          this.isCheckingCemaden.set(false);

          if (this.selectedMethod() === 'bartlett-lewis') {
            this.selectedMethod.set('cetesb');
          }
        },
      });
  }

  private checkExistingStep(projectId: string): void {
    this.stepSub?.unsubscribe();
    this.stepSub = this.projectStepsService
      .getProjectStep(projectId, 'TEMPORAL_RESOLUTION')
      .subscribe({
        next: (step) => {
          const isCompleted = step?.status === 'COMPLETED';
          const isCetesb =
            (step?.params as any)?.method === 'CETESB' ||
            (step?.result as any)?.method === 'CETESB';
          this.isCetesbExecuted.set(isCompleted && isCetesb);
        },
        error: () => {
          this.isCetesbExecuted.set(false);
        },
      });
  }

  onExecuteDisaggregation(): void {
    const project = this.project();
    if (!project || this.isExecuting()) return;

    if (this.selectedMethod() === 'cetesb') {
      this.isExecuting.set(true);
      this.disaggregationService.executeCetesb(project.id).subscribe({
        next: () => {
          this.isExecuting.set(false);
          this.isCetesbExecuted.set(true);
          toast.success('Desagregação por fatores CETESB executada com sucesso!');
          this.projectState.updateFurthestStep('DISTRIBUTION').subscribe({
            error: (err) => console.error('Erro ao atualizar etapa do projeto:', err),
          });
          setTimeout(() => this.scrollToResultCard(), 100);
        },
        error: (err) => {
          this.isExecuting.set(false);
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Erro ao executar a desagregação por fatores CETESB.';
          toast.error(msg);
        },
      });
    }
  }

  scrollToResultCard(): void {
    const el = document.getElementById('temporal-disaggregation-result-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onBack(): void {
    const project = this.project();
    if (!project || this.isAdvancing()) return;
    this.router.navigate(['/app/analysis', project.id, 'gap-filling']);
  }

  onAdvance(): void {
    const project = this.project();
    if (!project || this.isAdvancing() || !this.isCetesbExecuted()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('DISTRIBUTION').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'distribution']);
      },
      error: (err) => {
        this.isAdvancing.set(false);
        console.error('Erro ao avançar para distribuição:', err);
        this.router.navigate(['/app/analysis', project.id, 'distribution']);
      },
    });
  }
}
