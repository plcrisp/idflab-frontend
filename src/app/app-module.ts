import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { LayoutModule } from './layout/layout-module';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MainLayout } from './layout/main-layout/main-layout';

@NgModule({
  declarations: [],
  imports: [BrowserModule, AppRoutingModule, LayoutModule],
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [MainLayout],
})
export class AppModule {}
