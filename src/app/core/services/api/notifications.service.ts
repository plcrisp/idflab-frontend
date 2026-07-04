import { effect, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { NotificationsPanelResponse, Notification } from '../../models/api/notification.model';
import { environment } from '../../../../environments/environment';
import { poll } from '../../utils/polling.utils';
import { toast } from '@spartan-ng/brain/sonner';
import { AuthService } from '../../../features/auth/services/auth.service';

const POLL_INTERVAL_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  private readonly _panel = signal<NotificationsPanelResponse | null>(null);
  readonly panel = this._panel.asReadonly();

  private pollingSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    effect(() => {
      const currentUser = this.authService.user();

      if (currentUser) {
        // Usuário logado: inicia a busca
        this.startPolling();
      } else {
        // Usuário deslogado: limpa tudo
        this.stopPolling();
      }
    });
  }

  getPanel(): Observable<NotificationsPanelResponse> {
    return this.http.get<NotificationsPanelResponse>(`${this.baseUrl}/panel`);
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${notificationId}`);
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  readAll(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }

  refetch(): void {
    this.getPanel().subscribe((result) => {
      this.handleNewData(result);

      if (result.active_jobs.length > 0) {
        this.startPolling();
      }
    });
  }

  private startPolling(): void {
    this.pollingSub?.unsubscribe();

    this.pollingSub = poll(
      () => this.getPanel(),
      POLL_INTERVAL_MS,
      (result) => result.active_jobs.length > 0,
    ).subscribe((result) => this.handleNewData(result));
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
    this._panel.set(null);
  }

  private handleNewData(result: NotificationsPanelResponse): void {
    const currentPanel = this._panel();

    if (currentPanel) {
      const existingIds = new Set(currentPanel.notifications.map((n) => n.id));
      const newNotifications = result.notifications.filter(
        (n) => !existingIds.has(n.id) && !n.read,
      );

      newNotifications.forEach((notification) => this.showToast(notification));
    }

    this._panel.set(result);
  }

  private showToast(notification: Notification): void {
    const toastContent = notification.message;

    if (notification.type === 'SUCCESS') {
      toast.success(toastContent, {
        duration: 8000,
        position: 'bottom-center',
      });
    } else if (notification.type === 'FAILED') {
      toast.error(toastContent, {
        duration: 8000,
        position: 'bottom-center',
      });
    } else {
      toast(toastContent, {
        duration: 8000,
        position: 'bottom-center',
      });
    }
  }
}
