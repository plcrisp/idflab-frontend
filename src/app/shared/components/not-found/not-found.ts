import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutService } from '../../../core/services/state/main-layout.service';

@Component({
  selector: 'app-not-found',
  standalone: false,
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private router = inject(Router);
  private mainLayoutService = inject(MainLayoutService);

  constructor() {
    this.mainLayoutService.setBreadcrumbs([]);
  }

  goHome() {
    this.router.navigate(['/app/dashboard']);
  }
}
