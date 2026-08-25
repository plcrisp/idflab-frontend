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
  lucideArrowRight,
  lucideCalendar,
  lucideDatabase,
  lucideDownload,
  lucideTrendingUp,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TimeSeriesPanel } from './pages/initial-visualization/components/time-series-panel/time-series-panel';
import { TimeSeriesDetailChart } from './pages/initial-visualization/components/time-series-detail-chart/time-series-detail-chart';
import { AnnualMaxOverviewChart } from './pages/initial-visualization/components/annual-max-overview-chart/annual-max-overview-chart';
import { Stepper } from './shared/components/stepper/stepper';
import { ParamsHeader } from './shared/components/params-header/params-header';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { DataAvailabilityRibbon } from './shared/components/data-availability-ribbon/data-availability-ribbon';
import { HlmButtonImports } from '@spartan-ng/helm/button';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AnalysisLayout,
    InitialVisualization,
    TimeSeriesPanel,
    TimeSeriesDetailChart,
    AnnualMaxOverviewChart,
    Stepper,
    ParamsHeader,
    DataAvailabilityRibbon,
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
      lucideDownload,
      lucideArrowRight,
    }),
    ...HlmBadgeImports,
    ...HlmProgressImports,
    ...HlmButtonImports,
  ],
})
export class AnalysisModule {}
