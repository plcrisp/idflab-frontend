import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRegistration } from '../../features/auth/models/user.model';
import { MainLayoutService } from '../../core/services/main-layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  mainLayoutService = inject(MainLayoutService);

  breadcrumbs = this.mainLayoutService.breadcrumbs;
  workflowSteps = this.mainLayoutService.workflowSteps;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getMe().subscribe();
  }
}
