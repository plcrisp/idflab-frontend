import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { Dashboard } from './dashboard';
import { DASHBOARD_ROUTES } from './dashboard.routes';
import { NgIconsModule } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCalendar,
  lucideCheck,
  lucideCircleCheck,
  lucideClock,
  lucideFolder,
  lucideFolderOpen,
  lucideLayoutGrid,
  lucideLoader2,
  lucideMap,
  lucideMapPin,
  lucideMoreVertical,
  lucidePencil,
  lucidePlus,
  lucideRotateCw,
  lucideSearch,
  lucideTrash2,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { ProjectsHeader } from './components/projects-header/projects-header';
import { ProjectsStats } from './components/projects-stats/projects-stats';
import { ProjectsToolbar } from './components/projects-toolbar/projects-toolbar';
import { ProjectCard } from './components/project-card/project-card';
import { ProjectRenameModal } from './components/project-rename-modal/project-rename-modal';
import { ProjectDeleteModal } from './components/project-delete-modal/project-delete-modal';

@NgModule({
  declarations: [
    Dashboard,
    ProjectsHeader,
    ProjectsStats,
    ProjectsToolbar,
    ProjectCard,
    ProjectRenameModal,
    ProjectDeleteModal,
  ],
  imports: [
    CommonModule,
    TitleCasePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(DASHBOARD_ROUTES),
    SharedModule,
    ...HlmButtonImports,
    ...HlmBadgeImports,
    ...HlmInputImports,
    ...HlmDropdownMenuImports,
    ...HlmProgressImports,
    ...HlmSkeletonImports,
    ...HlmTooltipImports,
    NgIconsModule.withIcons({
      lucideArrowRight,
      lucideCalendar,
      lucideCheck,
      lucideCircleCheck,
      lucideClock,
      lucideFolder,
      lucideFolderOpen,
      lucideLayoutGrid,
      lucideLoader2,
      lucideMap,
      lucideMapPin,
      lucideMoreVertical,
      lucidePencil,
      lucidePlus,
      lucideRotateCw,
      lucideSearch,
      lucideTrash2,
      lucideTriangleAlert,
      lucideX,
    }),
  ],
})
export class DashboardModule {}
