import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { NgIconsModule } from '@ng-icons/core';
import {
  lucideBell,
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircle,
  lucideDroplet,
  lucideFolder,
  lucideFolderOpen,
  lucideGlobe,
  lucideHome,
  lucideHouse,
  lucideInbox,
  lucideLoader2,
  lucideMap,
  lucideMoon,
  lucideSearch,
  lucideSettings,
  lucideSun,
} from '@ng-icons/lucide';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { LoadingOverlay } from './components/loading-overlay/loading-overlay';
import { NotFound } from './components/not-found/not-found';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

@NgModule({
  declarations: [ThemeToggle, Navbar, Sidebar, LoadingOverlay, NotFound],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    RouterLink,
    NgIconsModule.withIcons({
      lucideSun,
      lucideMoon,
      lucideLoader2,
      lucideGlobe,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideBell,
      lucideHome,
      lucideFolderOpen,
      lucideFolder,
      lucideCheck,
      lucideCircle,
      lucideSettings,
      lucideDroplet,
      lucideMap,
      lucideHouse,
    }),
    ...HlmButtonImports,
    ...HlmSidebarImports,
    ...HlmCollapsibleImports,
    ...HlmEmptyImports,
    ...HlmBreadcrumbImports,
    ...HlmDropdownMenuImports,
    ...HlmAvatarImports,
    ...HlmSpinnerImports,
  ],
  exports: [ThemeToggle, Navbar, Sidebar, LoadingOverlay],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class SharedModule {}
