import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { Notification, ActiveJobItem } from '../../../core/models/api/notification.model';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { Router } from '@angular/router';
import { MapService } from '../../../core/services/utils/map.service';
import { Project } from '../../../core/models/api/project.model';
import {
  renderNotification,
  RenderedNotification,
} from '../../../core/utils/notification-render.util';
import { JobsService } from '../../../core/services/api/jobs.service';
import { ProjectStepsService } from '../../../core/services/api/project-steps.service';
import { Job, TaskType } from '../../../core/models/api/job.model';
import { CdkMenuTrigger } from '@angular/cdk/menu';

const TASK_STEP_ROUTE_MAP: Record<TaskType, string | null> = {
  DOWNLOAD_STATION_DATA: 'initial-view',
  DOWNLOAD_NEIGHBOR_STATION_DATA: null,
  QUALITY_ANALYSIS: 'consistency-check',
  GAP_FILLING: 'gap-filling',
  TEMPORAL_DISAGGREGATION: 'temporal-disaggregation',
  STATISTICAL_DISTRIBUTION: 'distribution',
  GENERATE_IDF: 'historical-idf',
  DOWNLOAD_CLIMBRA: 'cenarios-futuros',
  BIAS_CORRECTION: 'cenarios-futuros',
  FUTURE_SCENARIOS: 'cenarios-futuros',
  GENERATE_REPORT: 'resultados',
};

interface NotificationViewModel {
  notif: Notification;
  rendered: RenderedNotification;
}

@Component({
  selector: 'app-notifications-bell',
  standalone: false,
  templateUrl: './notifications-bell.html',
  styleUrl: './notifications-bell.scss',
})
export class NotificationsBell {
  private notificationsService = inject(NotificationsService);
  private projectsService = inject(ProjectsService);
  private jobsService = inject(JobsService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private projectStepsService = inject(ProjectStepsService);

  panel = this.notificationsService.panel;

  activeJobs = computed(() => this.panel()?.active_jobs ?? []);
  unreadCount = computed(() => this.panel()?.unread_count ?? 0);
  hasWorkingJobs = computed(() => this.activeJobs().length > 0);

  notifications = computed<NotificationViewModel[]>(() =>
    (this.panel()?.notifications ?? []).slice(0, 20).map((notif) => ({
      notif,
      rendered: renderNotification(notif),
    })),
  );

  @ViewChild('bellTrigger') bellTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(CdkMenuTrigger) menuTrigger!: CdkMenuTrigger;

  onMenuOpened(): void {
    if (this.unreadCount() > 0) {
      this.notificationsService.readAll().subscribe({
        error: console.error,
      });
    }
  }

  trackByNotifId(index: number, item: NotificationViewModel): string {
    return item.notif.id;
  }

  trackByJobId(index: number, item: ActiveJobItem): string {
    return item.job_id;
  }

  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId).subscribe();
  }

  private navigateForNeighborJob(projectId: string, jobId: string | null): void {
    if (!jobId) {
      this.router.navigateByUrl(`/app/analysis/${projectId}`);
      return;
    }
    this.projectStepsService.getStepsByProject(projectId).subscribe({
      next: (steps) => {
        const matchingStep = steps?.find(
          (s) => s.job_id && String(s.job_id).toLowerCase() === String(jobId).toLowerCase(),
        );
        if (matchingStep?.step === 'GAP_FILLING') {
          this.router.navigateByUrl(`/app/analysis/${projectId}/gap-filling`);
        } else if (matchingStep?.step === 'TEMPORAL_RESOLUTION') {
          this.router.navigateByUrl(`/app/analysis/${projectId}/temporal-disaggregation`);
        } else {
          this.router.navigateByUrl(`/app/analysis/${projectId}/consistency-check`);
        }
      },
      error: () => {
        this.router.navigateByUrl(`/app/analysis/${projectId}/consistency-check`);
      },
    });
  }

  private navigateToTaskStep(projectId: string, taskType: TaskType, jobId: string | null): void {
    if (taskType === 'DOWNLOAD_NEIGHBOR_STATION_DATA') {
      this.navigateForNeighborJob(projectId, jobId);
      return;
    }

    const stepPath = TASK_STEP_ROUTE_MAP[taskType];
    const targetUrl = stepPath ? `/app/analysis/${projectId}/${stepPath}` : `/app/analysis/${projectId}`;
    this.router.navigateByUrl(targetUrl);
  }

  openJob(job: ActiveJobItem): void {
    if (!job.project_id) return;
    this.menuTrigger.close();
    this.navigateToTaskStep(job.project_id, job.task_type, job.job_id);
  }

  openNotification(notif: Notification): void {
    this.menuTrigger.close();
    if (!notif.read) {
      this.markAsRead(notif.id);
    }

    if (notif.type === 'TIMEOUT') {
      this.retryTimeoutNotif(notif.job_id);
      if (notif.project_id) {
        this.navigateToTaskStep(notif.project_id, notif.task_type, notif.job_id);
      } else if (notif.task_type === 'DOWNLOAD_STATION_DATA') {
        this.navigateToFailedStationMap(notif);
      }
      return;
    }

    if (notif.type === 'FAILED') {
      if (notif.task_type === 'DOWNLOAD_STATION_DATA' || !notif.project_id) {
        this.navigateToFailedStationMap(notif);
        return;
      }
      this.navigateToTaskStep(notif.project_id, notif.task_type, notif.job_id);
      return;
    }

    if (notif.project_id) {
      this.navigateToTaskStep(notif.project_id, notif.task_type, notif.job_id);
    }
  }

  private navigateToFailedStationMap(notif: Notification): void {
    const detailsStationId = (notif.details as { station_id?: string })?.station_id;

    if (notif.project_id) {
      this.projectsService.getProjectById(notif.project_id).subscribe({
        next: (project: Project) => {
          const stationId = project.station_id || project.station?.id || detailsStationId;
          this.navigateToMapWithStation(stationId);
        },
        error: (err) => {
          console.error('Erro ao buscar projeto para navegação:', err);
          this.navigateToMapWithStation(detailsStationId);
        },
      });
    } else {
      this.navigateToMapWithStation(detailsStationId);
    }
  }

  private navigateToMapWithStation(stationId?: string | null): void {
    const targetUrl = '/app/interactive-map';
    const isAlreadyOnMap = this.router.url.split('?')[0] === targetUrl;

    if (stationId) {
      this.mapService.selectStation(stationId);
    }

    if (!isAlreadyOnMap) {
      this.router.navigateByUrl(targetUrl);
    }
  }

  private retryTimeoutNotif(jobId: string | null): void {
    if (!jobId) return;

    this.jobsService.retryCemadenCheck(jobId).subscribe({
      next: (job: Job) => {
        this.notificationsService.refetch();
      },
      error: (err) => {
        console.error('Erro ao buscar job para nova verificação:', err);
      },
    });
  }

  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.bellTrigger?.nativeElement.focus();

    this.notificationsService.deleteNotification(notificationId).subscribe({
      next: () => this.notificationsService.refetch(),
      error: console.error,
    });
  }

  getToneColor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'var(--success)';
      case 'warning':
        return 'var(--warning)';
      case 'error':
        return 'var(--destructive)';
      default:
        return 'inherit';
    }
  }

  getToneTitleColor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'var(--neutral-50)';
      case 'warning':
        return 'var(--warning)';
      case 'error':
        return 'var(--destructive)';
      default:
        return 'inherit';
    }
  }

  getToneMessageColor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'var(--neutral-200)';
      case 'warning':
        return 'var(--warning)';
      case 'error':
        return 'var(--destructive)';
      default:
        return 'inherit';
    }
  }
}
