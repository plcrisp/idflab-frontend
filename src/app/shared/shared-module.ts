import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { NgIconsModule } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';

@NgModule({
  declarations: [ThemeToggle],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgIconsModule.withIcons({
      lucideSun,
      lucideMoon,
    }),
  ],
  exports: [ThemeToggle],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class SharedModule {}
