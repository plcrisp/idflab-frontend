import { Component, inject, OnInit } from '@angular/core';
import { MainLayoutService } from '../../core/services/state/main-layout.service';
import { HlmSidebarService } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private mainLayoutService = inject(MainLayoutService);
  private sidebarService = inject(HlmSidebarService);

  ngOnInit() {
    this.mainLayoutService.setBreadcrumbs([
      { label: 'Dashboard', url: '/app/dashboard', active: true },
    ]);

    this.sidebarService.setOpen(true);
  }
}
