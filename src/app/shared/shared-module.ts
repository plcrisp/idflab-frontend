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
  lucideCircle,
  lucideDroplet,
  lucideFolder,
  lucideFolderOpen,
  lucideGlobe,
  lucideHome,
  lucideLoader2,
  lucideMoon,
  lucideSettings,
  lucideSun,
} from '@ng-icons/lucide';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';

@NgModule({
  declarations: [ThemeToggle, Navbar, Sidebar],
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
      lucideBell,
      lucideHome,
      lucideFolderOpen,
      lucideFolder,
      lucideCheck,
      lucideCircle,
      lucideSettings,
      lucideDroplet,
    }),
  ],
  exports: [ThemeToggle, Navbar, Sidebar],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class SharedModule {}
