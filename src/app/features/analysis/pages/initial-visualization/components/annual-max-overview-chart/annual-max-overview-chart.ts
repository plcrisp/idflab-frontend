import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  OnDestroy,
  ViewChild,
  untracked,
  effect,
} from '@angular/core';
import type { ECharts, EChartsOption } from 'echarts';
import { CoverageStatus, YearlySummaryItem } from '../../models/initial-visualization.model';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildFalhaLegendSeries,
  buildGrid,
  buildLegend,
  buildMarkArea,
  buildMarkPoint,
  buildMaxObservadoLegendSeries,
  buildSplitLineStyle,
  buildTooltipBase,
  hexToRgba,
} from '../../utils/chart-options.utils';
import { EchartsService } from '../../../../../../core/services/utils/echarts.service';

export interface YearRange {
  startYear: number;
  endYear: number;
}

@Component({
  selector: 'app-annual-max-overview-chart',
  standalone: false,
  templateUrl: './annual-max-overview-chart.html',
  styleUrl: './annual-max-overview-chart.scss',
  providers: [EchartsService],
})
export class AnnualMaxOverviewChart implements OnDestroy {
  data = input<YearlySummaryItem[] | null>(null);
  unit = input('mm');
  seriesName = input('Máximo Anual');
  selectedPeriod = input<YearRange | null>(null);
  periodSelected = output<YearRange | null>();

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<YearlySummaryItem[]>;

  private years: string[] = [];
  private chart?: ECharts;
  private brushListenerAttached = false;

  private applyingExternal = false;
  private lastAppliedPeriod: string | null = null;

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.data,
      buildOption: (data) => this.buildOption(data),
      onReady: (chart) => this.onChartReady(chart),
    });

    effect(() => {
      const period = this.selectedPeriod();
      if (!this.chart) return;
      this.syncExternalSelection(this.chart, period);
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private onChartReady(chart: ECharts): void {
    this.chart = chart;

    chart.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: 'lineX', brushMode: 'single' },
    });

    if (!this.brushListenerAttached) {
      this.brushListenerAttached = true;
      chart.on('brushSelected', (params: any) => this.handleBrushSelected(params));
    }

    untracked(() => this.syncExternalSelection(chart, this.selectedPeriod()));
  }

  private handleBrushSelected(params: any): void {
    if (this.applyingExternal) return; // ignora o eco de uma seleção programática

    const indices: number[] = (params.batch?.[0]?.selected ?? []).flatMap(
      (s: any) => s.dataIndex ?? [],
    );

    if (!indices.length) {
      this.lastAppliedPeriod = null;
      this.periodSelected.emit(null);
      return;
    }

    const startYear = Number(this.years[Math.min(...indices)]);
    const endYear = Number(this.years[Math.max(...indices)]);
    const period = { startYear, endYear };

    this.lastAppliedPeriod = JSON.stringify(period);
    this.periodSelected.emit(period);
  }

  private syncExternalSelection(chart: ECharts, period: YearRange | null): void {
    const key = period ? JSON.stringify(period) : null;
    if (key === this.lastAppliedPeriod) return;
    this.lastAppliedPeriod = key;

    if (!period || !this.years.length) return;

    const startIndex = this.years.indexOf(period.startYear.toString());
    const endIndex = this.years.indexOf(period.endYear.toString());
    if (startIndex === -1 || endIndex === -1) return;

    this.applyingExternal = true;
    chart.dispatchAction({
      type: 'brush',
      areas: [{ brushType: 'lineX', xAxisIndex: 0, coordRange: [startIndex, endIndex] }],
    });
    this.applyingExternal = false;
  }

  private findGlobalMax(data: YearlySummaryItem[]): YearlySummaryItem | null {
    return data.reduce<YearlySummaryItem | null>((best, item) => {
      if (item.max_value === null) return best;
      if (!best || best.max_value === null || item.max_value > best.max_value) return item;
      return best;
    }, null);
  }

  private buildOption(data: YearlySummaryItem[]): EChartsOption {
    const t = this.echarts.getTokens();

    const years = data.map((d) => d.year.toString());
    this.years = years;
    const barData = data.map((d) => d.max_value);

    const markAreaData: [{ xAxis: number }, { xAxis: number }][] = [];
    let gapStart: number | null = null;

    data.forEach((d, i) => {
      const isGap = d.coverage_status !== 'complete';
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

    const globalMax = this.findGlobalMax(data);
    const annualMaxData = globalMax
      ? [
          {
            name: 'Máximo anual',
            coord: [globalMax.year.toString(), globalMax.max_value as number] as [string, number],
          },
        ]
      : [];

    const labelStep = Math.max(1, Math.round(years.length / 10));

    return {
      textStyle: { fontFamily: t.fontFamily },
      legend: buildLegend(this.seriesName(), t),
      grid: buildGrid(),
      brush: {
        toolbox: [],
        xAxisIndex: 0,
        brushType: 'lineX',
        brushMode: 'single',
        throttleType: 'debounce',
        throttleDelay: 300,
        brushStyle: {
          color: hexToRgba(t.primary, 0.15),
          borderColor: t.primary,
          borderWidth: 1,
        },
        transformable: true,
      },
      tooltip: {
        ...buildTooltipBase(t),
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const p = items.find((it: any) => it.componentSubType === 'bar') ?? items[0];
          const item = data[p.dataIndex];
          if (!item) return '';

          const valueLabel =
            item.max_value === null
              ? 'Sem dado registrado'
              : `${item.max_value.toLocaleString('pt-BR')} ${this.unit()}`;

          const dateLabel = item.max_value_date
            ? new Date(item.max_value_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : null;

          const statusLabel: Record<CoverageStatus, string | null> = {
            complete: null,
            partial: `Cobertura parcial · ${item.failure_percentage.toLocaleString('pt-BR')}% de falhas`,
            failure: `Cobertura insuficiente · ${item.failure_percentage.toLocaleString('pt-BR')}% de falhas`,
          };
          const status = statusLabel[item.coverage_status];

          return `
            <div style="font-weight:600;margin-bottom:2px;">${item.year}</div>
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
            interval: (index: number) => index % labelStep === 0,
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
        splitNumber: 2,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: buildSplitLineStyle(t),
        axisLabel: {
          ...buildAxisLabelBase(t),
          hideOverlap: true,
          formatter: `{value} ${this.unit()}`,
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
          itemStyle: { color: t.primary, borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: t.primaryDark } },
          markPoint: buildMarkPoint(annualMaxData, t),
        },
        buildMaxObservadoLegendSeries(t, { symbol: 'scatter' }),
        buildFalhaLegendSeries(t, 'scatter'),
      ],
    };
  }
}
