import { CommonModule } from '@angular/common';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainLayout } from './main-layout/main-layout';
import { FormsModule } from '@angular/forms';
import { AuthLayout } from './auth-layout/auth-layout';
import { SharedModule } from '../shared/shared-module';
import { AuthPresentationPanel } from './auth-layout/components/auth-presentation/auth-presentation-panel';

@NgModule({
  declarations: [MainLayout, AuthLayout],
  imports: [CommonModule, RouterModule, FormsModule, SharedModule, AuthPresentationPanel],
  exports: [MainLayout, AuthLayout],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class LayoutModule {}
