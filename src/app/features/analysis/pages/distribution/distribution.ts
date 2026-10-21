import { Component, effect, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';

@Component({
  selector: 'app-distribution',
  standalone: false,
  templateUrl: './distribution.html',
  styleUrl: './distribution.scss',
})
export class Distribution {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  readonly project = this.projectState.project;

  constructor() {
    effect(() => {
      const project = this.project();
      if (!project) return;

      const projectName = new TitleCasePipe().transform(project.name) || project.name;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: projectName, url: `/app/project/${project.id}` },
        { label: 'Distribuição Estatística', url: `/app/analysis/${project.id}/distribution` },
      ]);
    });
  }

  onBack(): void {
    const project = this.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'temporal-disaggregation']);
  }
}
