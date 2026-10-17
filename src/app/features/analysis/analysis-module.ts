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
  lucideArrowUp,
  lucideArrowUpRight,
  lucideCalendar,
  lucideChartColumn,
  lucideCheck,
  lucideCheckCircle2,
  lucideChevronDown,
  lucideChevronUp,
  lucideClock,
  lucideDatabase,
  lucideDownload,
  lucideDroplets,
  lucideFilter,
  lucideInfo,
  lucideLoader2,
  lucideMap,
  lucideMapPin,
  lucideRotateCw,
  lucideScan,
  lucideShieldCheck,
  lucideSparkles,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideWrench,
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
import { NeighborStationsCard } from './shared/components/neighbor-stations-card/neighbor-stations-card';
import { NeighborStationsMap } from './shared/components/neighbor-stations-card/components/neighbor-stations-map/neighbor-stations-map';
import { NeighborStationConfirmation } from './shared/components/neighbor-stations-card/components/neighbor-station-confirmation/neighbor-station-confirmation';
import { DoubleMassChart } from './pages/consistency-check/components/double-mass-chart/double-mass-chart';
import { NeighborAnalysisCard } from './pages/consistency-check/components/neighbor-analysis-card/neighbor-analysis-card';
import { ConsistencyAnalysis } from './pages/consistency-check/components/consistency-analysis/consistency-analysis';
import { GapFilling } from './pages/gap-filling/gap-filling';
import { Path } from './shared/components/path/path';
import { GapFillingPathSelector } from './pages/gap-filling/components/gap-filling-path-selector/gap-filling-path-selector';
import { GapFillingPreMetricsCard } from './pages/gap-filling/components/gap-filling-pre-metrics-card/gap-filling-pre-metrics-card';
import { GapFillingPostMetricsCard } from './pages/gap-filling/components/gap-filling-post-metrics-card/gap-filling-post-metrics-card';
import { YearDataAvailability } from './pages/gap-filling/components/year-data-availability/year-data-availability';
import { TemporalDisaggregation } from './pages/temporal-disaggregation/temporal-disaggregation';
import { TemporalDisaggregationPathSelector } from './pages/temporal-disaggregation/components/temporal-disaggregation-path-selector/temporal-disaggregation-path-selector';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AnalysisLayout,
    InitialVisualization,
    InitialKpiCards,
    TimeSeriesPanel,
    AnnualMaxOverviewChart,
    Stepper,
    ParamsHeader,
    DataAvailabilityRibbon,
    ConsistencyCheck,
    StationSummaryBar,
    NeighborStationsCard,
    NeighborStationsMap,
    NeighborStationConfirmation,
    DoubleMassChart,
    NeighborAnalysisCard,
    ConsistencyAnalysis,
    GapFilling,
    TemporalDisaggregation,
  ],
  exports: [
    StationSummaryBar,
    NeighborStationsCard,
    NeighborStationsMap,
    NeighborStationConfirmation,
    DoubleMassChart,
    NeighborAnalysisCard,
    GapFilling,
    TemporalDisaggregation,
    Path,
    GapFillingPathSelector,
    GapFillingPreMetricsCard,
    GapFillingPostMetricsCard,
    YearDataAvailability,
    TimeSeriesDetailChart,
    TemporalDisaggregationPathSelector,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(ANALYSIS_ROUTES),
    SharedModule,
    TimeSeriesDetailChart,
    Path,
    GapFillingPathSelector,
    GapFillingPreMetricsCard,
    GapFillingPostMetricsCard,
    YearDataAvailability,
    TemporalDisaggregationPathSelector,
    NgIconsModule.withIcons({
      lucideDatabase,
      lucideTriangleAlert,
      lucideCalendar,
      lucideChevronDown,
      lucideChevronUp,
      lucideTrendingUp,
      lucideDownload,
      lucideArrowRight,
      lucideArrowLeft,
      lucideArrowUp,
      lucideArrowUpRight,
      lucideMap,
      lucideMapPin,
      lucideClock,
      lucideLoader2,
      lucideShieldCheck,
      lucideActivity,
      lucideCheck,
      lucideCheckCircle2,
      lucideSparkles,
      lucideScan,
      lucideRotateCw,
      lucideInfo,
      lucideWrench,
      lucideFilter,
      lucideChartColumn,
      lucideDroplets,
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
export class AnalysisModule { }
