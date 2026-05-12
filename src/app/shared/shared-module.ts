import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { NgIconsModule } from '@ng-icons/core';
import {
  lucideBell,
  lucideChevronDown,
  lucideGlobe,
  lucideLoader2,
  lucideMoon,
  lucideSun,
} from '@ng-icons/lucide';
import { Navbar } from './components/navbar/navbar';

@NgModule({
  declarations: [ThemeToggle, Navbar],
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
    }),
  ],
  exports: [ThemeToggle, Navbar],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class SharedModule {}
