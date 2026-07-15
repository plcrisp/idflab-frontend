import { inject, Injectable, signal } from '@angular/core';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { Project } from '../../../core/models/api/project.model';

@Injectable()
export class ProjectStateService {
  private projectsService = inject(ProjectsService);

  private _project = signal<Project | null>(null);
  private _loading = signal(true);

  readonly project = this._project.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadProject(projectId: string): void {
    this._loading.set(true);
    this.projectsService.getProjectById(projectId).subscribe({
      next: (project) => {
        console.log(project);
        this._project.set(project);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar projeto:', err);
        this._loading.set(false);
      },
    });
  }
}
