import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainLayout } from './main-layout/main-layout';

@NgModule({
  declarations: [MainLayout],
  imports: [CommonModule, RouterModule],
  exports: [MainLayout],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class LayoutModule {}
