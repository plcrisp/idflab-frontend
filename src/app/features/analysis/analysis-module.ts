import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { NgIconsModule } from '@ng-icons/core';
import { InitialVisualization } from './pages/initial-visualization/initial-visualization';
import { ANALYSIS_ROUTES } from './analysis.routes';
import { AnalysisLayout } from './analysis-layout/analysis-layout';
import {
  lucideCalendar,
  lucideDatabase,
  lucideTrendingUp,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TimeSeriesPanel } from './components/time-series-panel/time-series-panel';
import { TimeSeriesDetailChart } from './components/time-series-detail-chart/time-series-detail-chart';
import { AnnualMaxOverviewChart } from './components/annual-max-overview-chart/annual-max-overview-chart';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AnalysisLayout,
    InitialVisualization,
    TimeSeriesPanel,
    TimeSeriesDetailChart,
    AnnualMaxOverviewChart,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(ANALYSIS_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({
      lucideDatabase,
      lucideTriangleAlert,
      lucideCalendar,
      lucideTrendingUp,
    }),
  ],
})
export class AnalysisModule {}
