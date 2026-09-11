import { Component, effect, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ProjectStateService } from '../../services/project-state.service';
import { Project } from '../../../../core/models/api/project.model';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  readonly project: Signal<Project | null> = this.projectState.project;
  readonly activeJob = this.projectState.activeJob;
  readonly isJobRunning = this.projectState.isJobRunning;
  readonly hasInsufficientData = this.projectState.hasInsufficientData;

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
