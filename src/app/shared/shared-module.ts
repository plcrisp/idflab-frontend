import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { NgIconsModule } from '@ng-icons/core';
import {
  lucideBell,
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
  lucideLoader2,
  lucideMap,
  lucideMoon,
  lucideSettings,
  lucideSun,
} from '@ng-icons/lucide';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { LoadingOverlay } from './components/loading-overlay/loading-overlay';
import { NotFound } from './components/not-found/not-found';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@NgModule({
  declarations: [ThemeToggle, Navbar, Sidebar, LoadingOverlay, NotFound],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
    }),
    ...HlmButtonImports,
  ],
  exports: [ThemeToggle, Navbar, Sidebar, LoadingOverlay],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class SharedModule {}
