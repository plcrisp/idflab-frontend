import { Component, ElementRef, inject, input, OnDestroy, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import {
  DetailPoint,
  DetailResponse,
  FailureWindow,
} from '../../models/initial-visualization.model';
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
  CHART_LEGEND_LABELS,
} from '../../utils/chart-options.utils';
import { EchartsService } from '../../../../../../core/services/utils/echarts.service';

const MONTHS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-time-series-detail-chart',
  standalone: false,
  templateUrl: './time-series-detail-chart.html',
  styleUrl: './time-series-detail-chart.scss',
  providers: [EchartsService],
})
export class TimeSeriesDetailChart implements OnDestroy {
  data = input<DetailResponse | null>(null);
  unit = input('mm');
  seriesName = input('Precipitação diária');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<DetailResponse>;

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.data,
      buildOption: (data) => this.buildOption(data),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(data: DetailResponse): EChartsOption {
    const { points, failure_windows } = data;
    const t = this.echarts.getTokens();

    const barData = points.map((p: DetailPoint) => [
      new Date(p.date).getTime(),
      p.is_failure ? null : p.value,
    ]);

    const annualMaxData = points
      .filter((p) => p.is_annual_max)
      .map((p) => ({
        name: 'Máximo anual',
        coord: [new Date(p.date).getTime(), p.value] as [number, number],
      }));

    const HALF_DAY_MS = DAY_MS / 2;

    const markAreaData = (failure_windows ?? []).map((w: FailureWindow) => [
      { xAxis: new Date(w.start).getTime() - HALF_DAY_MS },
      { xAxis: new Date(w.end).getTime() + HALF_DAY_MS },
    ]);

    const firstTs = barData[0]?.[0] ?? 0;
    const lastTs = barData[barData.length - 1]?.[0] ?? 0;
    const spanDays = (lastTs - firstTs) / DAY_MS;

    const tickStepDays =
      spanDays <= 21 ? 2 : spanDays <= 45 ? 5 : spanDays <= 90 ? 7 : spanDays <= 180 ? 14 : 30;

    const tickInterval = tickStepDays * DAY_MS;

    const tickValues: number[] = [];
    for (let ts = firstTs; ts <= lastTs; ts += tickInterval) {
      tickValues.push(ts);
    }
    if (tickValues[tickValues.length - 1] !== lastTs) {
      tickValues.push(lastTs);
    }

    return {
      textStyle: { fontFamily: t.fontFamily },
      legend: buildLegend(this.seriesName(), CHART_LEGEND_LABELS.maxPeriodo, t),
      grid: buildGrid(),
      tooltip: {
        ...buildTooltipBase(t),
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const timestamp = Array.isArray(p.value) ? p.value[0] : p.axisValue;
          const value = Array.isArray(p.value) ? p.value[1] : p.data;
          const date = new Date(timestamp);
          const dateLabel = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
          const valueLabel =
            value === null || value === undefined
              ? 'Sem dado registrado'
              : `${value.toLocaleString('pt-BR')} ${this.unit()}`;
          return `<div style="font-weight:600;margin-bottom:2px;">${dateLabel}</div>${valueLabel}`;
        },
      },
      xAxis: {
        type: 'time',
        axisLine: buildAxisLineStyle(t),
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(t),
          margin: 12,
          customValues: tickValues,
          formatter: (value: number) => {
            const d = new Date(value);
            const day = d.getUTCDate();
            const month = MONTHS_PT[d.getUTCMonth()];
            return `${day} ${month}`;
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        interval: 50,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: buildSplitLineStyle(t),
        axisLabel: {
          ...buildAxisLabelBase(t),
          formatter: `{value} ${this.unit()}`,
        },
      },
      series: [
        {
          name: this.seriesName(),
          type: 'bar',
          data: barData,
          barCategoryGap: '0%',
          itemStyle: { color: t.primary, borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: t.primaryDark } },
          markPoint: buildMarkPoint(annualMaxData, t),
          markArea: buildMarkArea(markAreaData, t),
        },
        buildMaxObservadoLegendSeries(t, CHART_LEGEND_LABELS.maxPeriodo),
        buildFalhaLegendSeries(t, 'bar'),
      ],
    };
  }
}
