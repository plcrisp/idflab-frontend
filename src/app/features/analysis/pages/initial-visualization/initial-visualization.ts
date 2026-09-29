import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { MapService } from '../../../../core/services/utils/map.service';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationStateService } from './services/initial-visualization-state.service';

@Component({
  selector: 'app-initial-visualization',
  standalone: false,
  templateUrl: './initial-visualization.html',
  styleUrl: './initial-visualization.scss',
  providers: [InitialVisualizationStateService],
})
export class InitialVisualization {
  private mainLayoutService = inject(MainLayoutService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private projectState = inject(ProjectStateService);

  readonly state = inject(InitialVisualizationStateService);
  readonly isAdvancing = signal(false);

  constructor() {
    effect(() => {
      const project = this.state.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `app/project/${project.id}` },
        { label: 'Visualização Inicial', url: `/app/analysis/${project.id}/initial-view` },
      ]);
    });
  }

  onYearSelected(year: number): void {
    this.state.selectYear(year);
  }

  onRangeSelected(range: [string, string]): void {
    this.state.selectRange(range);
  }

  onBackToMap(): void {
    const project = this.state.project();
    const stationId = project?.station_id || project?.station?.id;
    if (stationId) {
      this.mapService.selectStation(stationId);
    }
    this.router.navigateByUrl('/app/interactive-map');
  }

  onDownloadRawSeries(): void {
    this.state.downloadRawSeries();
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project || this.isAdvancing() || this.state.isAdvanceDisabled()) return;

    this.isAdvancing.set(true);
    this.projectState.updateFurthestStep('CONSISTENCY').subscribe({
      next: () => {
        this.isAdvancing.set(false);
        this.router.navigate(['/app/analysis', project.id, 'consistency-check']);
      },
      error: (err) => {
        console.error('Erro ao avançar para a verificação de consistência:', err);
        this.isAdvancing.set(false);
        toast.error('Não foi possível avançar para a próxima etapa. Tente novamente.');
      },
    });
  }
}

