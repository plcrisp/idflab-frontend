import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { Dashboard } from './dashboard';
import { DASHBOARD_ROUTES } from './dashboard.routes';
import { NgIconsModule } from '@ng-icons/core';
import { lucideFolderOpen, lucideMap } from '@ng-icons/lucide';

@NgModule({
  declarations: [Dashboard],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(DASHBOARD_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({
      lucideFolderOpen,
      lucideMap,
    }),
  ],
})
export class DashboardModule {}
