import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { NotificationsPanelResponse, Notification } from '../../models/api/notification.model';
import { environment } from '../../../../environments/environment';
import { poll } from '../../utils/polling.utils';

const POLL_INTERVAL_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  private readonly _panel = signal<NotificationsPanelResponse | null>(null);
  readonly panel = this._panel.asReadonly();

  private pollingSub: Subscription | null = null;

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  getPanel(): Observable<NotificationsPanelResponse> {
    return this.http.get<NotificationsPanelResponse>(`${this.baseUrl}/panel`);
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  readAll(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }

  private startPolling(): void {
    this.pollingSub?.unsubscribe();

    this.pollingSub = poll(
      () => this.getPanel(),
      POLL_INTERVAL_MS,
      (result) => result.active_jobs.length > 0,
    ).subscribe((result) => this._panel.set(result));
  }

  refetch(): void {
    this.getPanel().subscribe((result) => {
      this._panel.set(result);

      if (result.active_jobs.length > 0) {
        this.startPolling();
      }
    });
  }
}
