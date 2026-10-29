import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';
import { ECElementEvent, EChartsOption } from 'echarts';
import { CoverageStatus, YearlySummaryItem } from '../../models/initial-visualization.model';
import { formatMaxDate } from '../../utils/initial-visualization.utils';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildFalhaLegendSeries,
  buildGrid,
  buildHistoricalMaxMarkLine,
  buildLegend,
  buildMarkArea,
  buildMarkPoint,
  buildMaxObservadoLegendSeries,
  buildSelectedYearLegendSeries,
  buildSplitLineStyle,
  buildTooltipBase,
  calcYAxisMax,
  CHART_LEGEND_LABELS,
} from '../../utils/chart-options.utils';
import { EchartsService } from '../../../../../../core/services/utils/echarts.service';

export interface AnnualMaxChartItem {
  year: number;
  max_value?: number | null;
  value?: number | null;
  max_value_date?: string | null;
  failure_percentage?: number;
  coverage_status?: CoverageStatus;
}
@Component({
  selector: 'app-annual-max-overview-chart',
  standalone: false,
  templateUrl: './annual-max-overview-chart.html',
  styleUrl: './annual-max-overview-chart.scss',
  providers: [EchartsService],
  host: { class: 'block w-full min-w-0' },
})
export class AnnualMaxOverviewChart implements OnDestroy {
  data = input<AnnualMaxChartItem[] | YearlySummaryItem[] | null>(null);
  unit = input('mm');
  seriesName = input('Precipitação diária máxima anual');
  selectedYear = input<number | null>(null);
  historicalMaxValue = input<number | null>(null);
  isHourly = input<boolean>(false);
  showGaps = input<boolean>(true);
  showSelectedYear = input<boolean>(true);
  clickable = input<boolean>(true);
  yAxisInterval = input<number | 'auto' | null>(null);
  yearClick = output<number>();

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    items: (AnnualMaxChartItem | YearlySummaryItem)[];
    selectedYear: number | null;
    historicalMaxValue: number | null;
    isHourly: boolean;
    seriesName: string;
  }>;

  private readonly chartInput = computed(() => ({
    items: this.data() ?? [],
    selectedYear: this.selectedYear(),
    historicalMaxValue: this.historicalMaxValue(),
    isHourly: this.isHourly(),
    seriesName: this.seriesName(),
  }));

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.chartInput,
      buildOption: ({ items, selectedYear, historicalMaxValue }) =>
        this.buildOption(items, selectedYear, historicalMaxValue),
      onClick: (params) => this.handleChartClick(params),
    });
  }

  private handleChartClick(params: ECElementEvent): void {
    if (!this.clickable()) return;
    if (params.componentType !== 'series' || params.seriesType !== 'bar') return;
    if (params.seriesName !== this.seriesName()) return;

    const year = Number(params.name);
    if (!Number.isNaN(year)) {
      this.yearClick.emit(year);
    }
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private findGlobalMax(data: AnnualMaxChartItem[]): AnnualMaxChartItem | null {
    return data.reduce<AnnualMaxChartItem | null>((best, item) => {
      const val = item.value ?? item.max_value ?? null;
      if (val === null) return best;
      const bestVal = best ? (best.value ?? best.max_value ?? null) : null;
      if (bestVal === null || val > bestVal) return item;
      return best;
    }, null);
  }

  private getAdaptiveStep(targetMax: number): number {
    if (targetMax <= 2) return 0.5;
    if (targetMax <= 6) return 1;
    if (targetMax <= 14) return 2;
    if (targetMax <= 30) return 5;
    if (targetMax <= 60) return 10;
    if (targetMax <= 120) return 20;
    return 50;
  }

  private buildOption(
    data: AnnualMaxChartItem[],
    selectedYear: number | null,
    historicalMaxValue: number | null = null,
  ): EChartsOption {
    const t = this.echarts.getTokens();

    const years = data.map((d) => d.year.toString());
    const selectedYearStr = this.showSelectedYear() && selectedYear !== null ? selectedYear.toString() : null;

    const barData = data.map((d) => {
      const val = d.value ?? d.max_value ?? null;
      const isSelected = selectedYearStr !== null && d.year.toString() === selectedYearStr;
      if (!isSelected) return val;

      // barra do ano selecionado
      return {
        value: val,
        itemStyle: {
          color: t.chartBarSelected,
        },
      };
    });

    const selectedItem =
      selectedYearStr !== null
        ? (data.find((d) => d.year.toString() === selectedYearStr) ?? null)
        : null;

    const markAreaData: [{ xAxis: number }, { xAxis: number }][] = [];
    if (this.showGaps()) {
      let gapStart: number | null = null;

      data.forEach((d, i) => {
        const isGap = d.coverage_status && d.coverage_status !== 'complete';
        if (isGap && gapStart === null) {
          gapStart = i;
        } else if (!isGap && gapStart !== null) {
          markAreaData.push([{ xAxis: gapStart }, { xAxis: i }]);
          gapStart = null;
        }
      });
      if (gapStart !== null) {
        markAreaData.push([{ xAxis: gapStart }, { xAxis: data.length }]);
      }
    }

    const globalMax = this.findGlobalMax(data);
    const globalVal = globalMax ? (globalMax.value ?? globalMax.max_value ?? null) : null;
    const histMax = historicalMaxValue ?? globalVal ?? null;

    let step = 50;
    const explicitInterval = this.yAxisInterval();
    if (typeof explicitInterval === 'number') {
      step = explicitInterval;
    } else if (explicitInterval === 'auto' || this.unit() !== 'mm') {
      const targetMax = Math.max(histMax ?? 0, globalVal ?? 0);
      step = this.getAdaptiveStep(targetMax);
    }
    const annualMaxData = globalMax && globalVal !== null
      ? [
          {
            name: this.unit() === 'mm/h' ? 'Intensidade máxima' : 'Máximo anual',
            coord: [globalMax.year.toString(), globalVal as number] as [string, number],
          },
        ]
      : [];

    const labelStep = Math.max(1, Math.round(years.length / 10));

    return {
      useUTC: true,
      textStyle: { fontFamily: t.fontFamily },
      legend: buildLegend(
        this.seriesName(),
        CHART_LEGEND_LABELS.maxObservado,
        t.primaryDark,
        t,
        null,
        selectedYearStr !== null ? CHART_LEGEND_LABELS.anoSelecionado : null,
      ),
      grid: buildGrid(12),
      tooltip: {
        ...buildTooltipBase(t),
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const p = items.find((it: any) => it.componentSubType === 'bar') ?? items[0];
          const item = data[p.dataIndex];
          if (!item) return '';

          const rawVal = item.value ?? item.max_value ?? null;
          const valueLabel =
            rawVal === null
              ? 'Sem dado registrado'
              : `${rawVal.toLocaleString('pt-BR')} ${this.unit()}`;

          const dateLabel = item.max_value_date
            ? formatMaxDate(item.max_value_date, this.isHourly())
            : null;

          const failPct = item.failure_percentage ?? 0;
          const statusLabel: Record<CoverageStatus, string | null> = {
            complete: null,
            partial: `Cobertura parcial · ${failPct.toLocaleString('pt-BR')}% de falhas`,
            failure: `Cobertura insuficiente · ${failPct.toLocaleString('pt-BR')}% de falhas`,
          };
          const status =
            this.showGaps() && item.coverage_status ? statusLabel[item.coverage_status] : null;

          const isSelected = selectedYearStr !== null && item.year.toString() === selectedYearStr;

          return `
            <div style="font-weight:600;margin-bottom:2px;">${item.year}${isSelected ? ' · Selecionado' : ''}</div>
            <div>${valueLabel}${dateLabel ? ` · ${dateLabel}` : ''}</div>
            ${status ? `<div style="color:${t.error};margin-top:4px;">${status}</div>` : ''}
          `;
        },
      },
      xAxis: [
        {
          type: 'category',
          data: years,
          axisLine: buildAxisLineStyle(t),
          axisTick: { show: false },
          axisLabel: {
            ...buildAxisLabelBase(t),
            margin: 12,
            interval: (index: number) =>
              index % labelStep === 0 || years[index] === selectedYearStr,
            formatter: (value: string) =>
              value === selectedYearStr ? `{selected|${value}}` : value,
            rich: {
              selected: {
                color: t.chartBarSelected,
                fontWeight: 600,
              },
            },
          },
          splitLine: { show: false },
        },
        {
          type: 'value',
          min: 0,
          max: data.length,
          show: false,
        },
      ],
      yAxis: {
        type: 'value',
        interval: step,
        max: (extent: { min: number; max: number }) => calcYAxisMax(extent.max, histMax, step),
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: buildSplitLineStyle(t),
        axisLabel: {
          ...buildAxisLabelBase(t),
          hideOverlap: true,
          formatter: (value: number) => {
            const valStr =
              step < 1
                ? value.toFixed(1).replace('.', ',')
                : Math.round(value).toLocaleString('pt-BR');
            return `${valStr} ${this.unit()}`;
          },
        },
      },
      series: [
        {
          type: 'line',
          xAxisIndex: 1,
          data: [],
          silent: true,
          tooltip: { show: false },
          markArea: buildMarkArea(markAreaData, t),
        },
        {
          name: this.seriesName(),
          type: 'bar',
          data: barData,
          barCategoryGap: '20%',
          cursor: this.clickable() ? 'pointer' : 'default',
          itemStyle: { color: t.primaryDark, borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: t.primaryMid } },
          markPoint: buildMarkPoint(annualMaxData, t),
          markLine: buildHistoricalMaxMarkLine(histMax, t, this.unit()),
        },
        buildMaxObservadoLegendSeries(t, CHART_LEGEND_LABELS.maxObservado, { symbol: 'scatter' }),
        ...(this.showGaps() ? [buildFalhaLegendSeries(t, 'scatter')] : []),
        ...(selectedYearStr !== null
          ? [buildSelectedYearLegendSeries(t, CHART_LEGEND_LABELS.anoSelecionado)]
          : []),
      ],
    };
  }
}
