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
import { Job } from '../../../core/models/api/job.model';
import { CdkMenuTrigger } from '@angular/cdk/menu';

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

  panel = this.notificationsService.panel;

  activeJobs = computed(() => this.panel()?.active_jobs ?? []);
  unreadCount = computed(() => this.panel()?.unread_count ?? 0);
  hasWorkingJobs = computed(() => this.activeJobs().length > 0);

  notifications = computed<NotificationViewModel[]>(() =>
    (this.panel()?.notifications ?? []).map((notif) => ({
      notif,
      rendered: renderNotification(notif),
    })),
  );

  @ViewChild('bellTrigger') bellTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(CdkMenuTrigger) menuTrigger!: CdkMenuTrigger;

  onMenuClosed(): void {
    this.notificationsService.readAll().subscribe({
      next: () => this.notificationsService.refetch(),
      error: console.error,
    });
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

  openJob(job: ActiveJobItem): void {
    if (!job.project_id) return;
    this.menuTrigger.close();
    this.router.navigateByUrl(`/app/analysis/${job.project_id}`);
  }

  openNotification(notif: Notification): void {
    this.menuTrigger.close();
    if (notif.type === 'TIMEOUT') {
      this.retryTimeoutNotif(notif.job_id);
    } else {
      this.openProject(notif);
    }
  }

  private openProject(notif: Notification): void {
    if (notif.type === 'SUCCESS') {
      if (notif.project_id) {
        this.router.navigateByUrl(`/app/analysis/${notif.project_id}`);
      }
      return;
    }

    if (notif.type === 'FAILED') {
      const detailsStationId = (notif.details as any)?.station_id;

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
