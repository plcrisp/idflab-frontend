import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainLayout } from './main-layout/main-layout';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [MainLayout],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [MainLayout],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class LayoutModule {}
