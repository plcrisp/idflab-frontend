import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { ANALYSIS_ROUTES } from './analysis.routes';
import { InteractiveMap } from './pages/interactive-map/interactive-map';

@NgModule({
  declarations: [InteractiveMap],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(ANALYSIS_ROUTES),
    SharedModule,
  ],
})
export class AnalysisModule {}
