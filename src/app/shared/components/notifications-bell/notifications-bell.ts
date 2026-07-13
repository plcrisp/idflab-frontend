import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { Notification } from '../../../core/models/api/notification.model';
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

  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId).subscribe();
  }

  openNotification(notif: Notification): void {
    this.menuTrigger.close();
    if (notif.type === 'TIMEOUT') {
      this.retryTimeoutNotif(notif.job_id);
    } else {
      this.openProject(notif.project_id, notif.type);
    }
  }

  private openProject(projectId: string | null, notifType: Notification['type']): void {
    if (!projectId) return;

    if (notifType === 'SUCCESS') {
      this.router.navigateByUrl(`/app/analysis/${projectId}`);
      return;
    }

    if (notifType === 'FAILED') {
      this.projectsService.getProjectById(projectId).subscribe({
        next: (project: Project) => {
          const targetUrl = '/app/interactive-map';

          if (this.router.url === targetUrl) {
            this.mapService.selectStation(project.station_id);
          } else {
            this.router.navigateByUrl(targetUrl).then((navigated) => {
              if (navigated) {
                this.mapService.selectStation(project.station_id);
              }
            });
          }
        },
        error: (err) => {
          console.error('Erro ao buscar projeto para navegação:', err);
        },
      });
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
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'inherit';
    }
  }

  getToneTitleColor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'var(--color-white)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'inherit';
    }
  }

  getToneMessageColor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'var(--color-grey-light)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'inherit';
    }
  }
}
