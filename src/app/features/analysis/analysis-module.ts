import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { NgIconsModule } from '@ng-icons/core';
import { InitialVisualization } from './pages/initial-visualization/initial-visualization';
import { ANALYSIS_ROUTES } from './analysis.routes';
import { AnalysisLayout } from './analysis-layout/analysis-layout';

@NgModule({
  declarations: [AnalysisLayout, InitialVisualization],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(ANALYSIS_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({}),
  ],
})
export class AnalysisModule {}
