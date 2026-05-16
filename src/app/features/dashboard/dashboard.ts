import { Component, inject, OnInit } from '@angular/core';
import { MainLayoutService } from '../../core/services/state/main-layout.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private MainLayoutService = inject(MainLayoutService);

  ngOnInit() {
    this.MainLayoutService.setBreadcrumbs([{ label: 'Dashboard', active: true }]);

    this.MainLayoutService.clearWorkflow();
  }
}
