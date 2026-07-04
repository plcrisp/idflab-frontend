import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { Notification, NotificationType } from '../../../core/models/api/notification.model';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { Router } from '@angular/router';
import { MapService } from '../../../core/services/utils/map.service';
import { Project } from '../../../core/models/api/project.model';

@Component({
  selector: 'app-notifications-bell',
  standalone: false,
  templateUrl: './notifications-bell.html',
  styleUrl: './notifications-bell.scss',
})
export class NotificationsBell {
  private notificationsService = inject(NotificationsService);
  private projectsService = inject(ProjectsService);
  private mapService = inject(MapService);
  private router = inject(Router);

  panel = this.notificationsService.panel;

  activeJobs = computed(() => this.panel()?.active_jobs ?? []);
  notifications = computed(() => this.panel()?.notifications ?? []);
  unreadCount = computed(() => this.panel()?.unread_count ?? 0);
  hasWorkingJobs = computed(() => this.activeJobs().length > 0);

  @ViewChild('bellTrigger') bellTrigger!: ElementRef<HTMLButtonElement>;

  onMenuClosed(): void {
    this.notificationsService.readAll().subscribe({
      next: () => this.notificationsService.refetch(),
      error: console.error,
    });
  }

  trackByNotifId(index: number, notif: Notification): string {
    return notif.id;
  }

  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId).subscribe();
  }

  openProject(projectId: string | null, notifType: NotificationType): void {
    if (!projectId) return;

    if (notifType === 'SUCCESS') {
      this.router.navigateByUrl(`/app/projects/${projectId}`);
      return;
    }

    if (notifType === 'FAILED') {
      this.projectsService.getProjectById(projectId).subscribe({
        next: (project: Project) => {
          this.router.navigateByUrl('/app/analysis/interactive-map');
          this.mapService.selectStation(project.station_id);
        },
        error: (err) => {
          console.error('Erro ao buscar projeto para navegação:', err);
        },
      });
    }
  }

  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.bellTrigger?.nativeElement.focus();

    this.notificationsService.deleteNotification(notificationId).subscribe({
      next: () => this.notificationsService.refetch(),
      error: console.error,
    });
  }
}
