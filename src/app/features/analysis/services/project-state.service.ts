import { computed, inject, Injectable, signal } from '@angular/core';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { Project } from '../../../core/models/api/project.model';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { ActiveJobItem } from '../../../core/models/api/notification.model';
import { SkeletonLoadingCoordinator } from '../../../core/utils/skeleton-loading-coordinator';

@Injectable()
export class ProjectStateService {
  private projectsService = inject(ProjectsService);
  private notificationsService = inject(NotificationsService);

  private _project = signal<Project | null>(null);
  private _loading = signal(true);
  private _hasInsufficientData = signal(false);

  readonly projectSkeleton = new SkeletonLoadingCoordinator({ delayMs: 350, minDurationMs: 250 });
  readonly showProjectSkeleton = this.projectSkeleton.showSkeleton;

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
    if (this._project()?.id !== projectId) {
      this._project.set(null);
      this._hasInsufficientData.set(false);
      this.projectSkeleton.reset();
    }
    this._loading.set(true);
    this.projectSkeleton.start();
    this.projectsService.getProjectById(projectId).subscribe({
      next: (project) => {
        this._project.set(project);
        this._loading.set(false);
        this.projectSkeleton.finish();
      },
      error: (err) => {
        console.error('Erro ao carregar projeto:', err);
        this._loading.set(false);
        this.projectSkeleton.finish();
      },
    });
  }
}
