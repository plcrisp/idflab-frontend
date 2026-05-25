import { Component, inject, OnInit } from '@angular/core';
import { MainLayoutService } from '../../core/services/state/main-layout.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private mainLayoutService = inject(MainLayoutService);

  ngOnInit() {
    this.mainLayoutService.setBreadcrumbs([{ label: 'Dashboard', active: true }]);

    if (this.mainLayoutService.isSidebarCollapsed()) {
      this.mainLayoutService.toggleSidebar();
    }
  }
}
