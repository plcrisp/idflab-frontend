import { computed, inject, Injectable, signal } from '@angular/core';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { Project } from '../../../core/models/api/project.model';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { ActiveJobItem } from '../../../core/models/api/notification.model';

@Injectable()
export class ProjectStateService {
  private projectsService = inject(ProjectsService);
  private notificationsService = inject(NotificationsService);

  private _project = signal<Project | null>(null);
  private _loading = signal(true);
  private _hasInsufficientData = signal(false);

  readonly project = this._project.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly hasInsufficientData = this._hasInsufficientData.asReadonly();

  readonly activeJob = computed<ActiveJobItem | null>(() => {
    const p = this._project();
    if (!p) return null;
    const panel = this.notificationsService.panel();
    return (
      panel?.active_jobs.find(
        (job) => job.project_id === p.id && job.task_type === 'DOWNLOAD_STATION_DATA',
      ) ?? null
    );
  });

  readonly isJobRunning = computed<boolean>(() => this.activeJob() !== null);

  setInsufficientData(value: boolean): void {
    this._hasInsufficientData.set(value);
  }

  loadProject(projectId: string): void {
    this._loading.set(true);
    this.projectsService.getProjectById(projectId).subscribe({
      next: (project) => {
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
