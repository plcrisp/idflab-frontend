import { Injectable, signal } from '@angular/core';
import { Breadcrumb, WorkflowStep } from '../../models/utils/main-layout.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MainLayoutService {
  private SIDEBAR_STATE = environment.storageKeys.sidebarState;

  breadcrumbs = signal<Breadcrumb[]>([]);

  isSidebarCollapsed = signal<boolean>(
    JSON.parse(localStorage.getItem(this.SIDEBAR_STATE) || 'false'),
  );

  setBreadcrumbs(crumbs: Breadcrumb[]) {
    this.breadcrumbs.set(crumbs);
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update((currentState) => {
      const newState = !currentState;

      localStorage.setItem(this.SIDEBAR_STATE, JSON.stringify(newState));
      return newState;
    });
  }
}
