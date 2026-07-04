import { Component, ElementRef, HostListener, computed, inject } from '@angular/core';
import { NotificationsService } from '../../../core/services/api/notifications.service';

@Component({
  selector: 'app-notifications-bell',
  standalone: false,
  templateUrl: './notifications-bell.html',
  styleUrl: './notifications-bell.scss',
})
export class NotificationsBell {
  private notificationsService = inject(NotificationsService);

  panel = this.notificationsService.panel;

  activeJobs = computed(() => this.panel()?.active_jobs ?? []);
  notifications = computed(() => this.panel()?.notifications ?? []);
  unreadCount = computed(() => this.panel()?.unread_count ?? 0);
  hasWorkingJobs = computed(() => this.activeJobs().length > 0);

  onMenuClosed(): void {
    this.notificationsService.readAll().subscribe({
      next: () => this.notificationsService.refetch(),
      error: console.error,
    });
  }

  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId).subscribe();
  }
}
