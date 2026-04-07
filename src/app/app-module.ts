import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { LayoutModule } from './layout/layout-module';

@NgModule({
  declarations: [],
  imports: [BrowserModule, AppRoutingModule, LayoutModule],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [],
})
export class AppModule {}
