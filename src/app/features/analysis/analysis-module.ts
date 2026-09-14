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
  lucideActivity,
  lucideArrowLeft,
  lucideArrowRight,
  lucideCalendar,
  lucideCheckCircle2,
  lucideChevronDown,
  lucideClock,
  lucideDatabase,
  lucideDownload,
  lucideMap,
  lucideShieldCheck,
  lucideSparkles,
  lucideTrendingUp,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TimeSeriesPanel } from './pages/initial-visualization/components/time-series-panel/time-series-panel';
import { TimeSeriesDetailChart } from './pages/initial-visualization/components/time-series-detail-chart/time-series-detail-chart';
import { AnnualMaxOverviewChart } from './pages/initial-visualization/components/annual-max-overview-chart/annual-max-overview-chart';
import { InitialKpiCards } from './pages/initial-visualization/components/initial-kpi-cards/initial-kpi-cards';
import { Stepper } from './shared/components/stepper/stepper';
import { ParamsHeader } from './shared/components/params-header/params-header';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { DataAvailabilityRibbon } from './shared/components/data-availability-ribbon/data-availability-ribbon';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDateRangePicker } from '@spartan-ng/helm/date-picker';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { ConsistencyCheck } from './pages/consistency-check/consistency-check';
import { StationSummaryBar } from './shared/components/station-summary-bar/station-summary-bar';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AnalysisLayout,
    InitialVisualization,
    InitialKpiCards,
    TimeSeriesPanel,
    TimeSeriesDetailChart,
    AnnualMaxOverviewChart,
    Stepper,
    ParamsHeader,
    DataAvailabilityRibbon,
    ConsistencyCheck,
    StationSummaryBar,
  ],
  exports: [StationSummaryBar],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(ANALYSIS_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({
      lucideDatabase,
      lucideTriangleAlert,
      lucideCalendar,
      lucideChevronDown,
      lucideTrendingUp,
      lucideDownload,
      lucideArrowRight,
      lucideArrowLeft,
      lucideMap,
      lucideClock,
      lucideShieldCheck,
      lucideActivity,
      lucideCheckCircle2,
      lucideSparkles,
    }),
    ...HlmBadgeImports,
    ...HlmProgressImports,
    ...HlmButtonImports,
    ...HlmTooltipImports,
    HlmDateRangePicker,
  ],
  providers: [
    provideNativeDateAdapter(),
    provideBrnCalendarI18n({
      formatWeekdayName: (index) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index],
      months: () => [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ],
      years: (startYear = 1900, endYear = 2050) =>
        Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i),
      formatHeader: (month, year) => {
        const months = [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ];
        return `${months[month]} de ${year}`;
      },
      formatMonth: (month) =>
        ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month],
      formatYear: (year) => `${year}`,
      labelPrevious: () => 'Mês anterior',
      labelNext: () => 'Próximo mês',
      labelWeekday: (index) =>
        [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ][index],
      firstDayOfWeek: () => 0,
    }),
  ],
})
export class AnalysisModule {}
