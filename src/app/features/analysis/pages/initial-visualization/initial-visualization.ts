import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { MapService } from '../../../../core/services/utils/map.service';
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

  readonly state = inject(InitialVisualizationStateService);

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
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'consistency-check']);
  }
}
