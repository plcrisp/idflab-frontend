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
  buildMaxPeriodoLegendSeries,
  buildSplitLineStyle,
  buildTooltipBase,
  CHART_LEGEND_LABELS,
  hexToRgba,
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

function isSameUTCDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

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
  historicalMaxDate = input<string | null>(null);

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

    const historicalMaxDate = this.historicalMaxDate();
    const historicalMaxRef = historicalMaxDate ? new Date(historicalMaxDate) : null;

    const annualMaxData = historicalMaxRef
      ? points
          .filter((p) => isSameUTCDate(new Date(p.date), historicalMaxRef))
          .map((p) => ({
            name: CHART_LEGEND_LABELS.maxObservado,
            coord: [new Date(p.date).getTime(), p.value] as [number, number],
          }))
      : [];

    let maxPeriodoValue = -Infinity;
    let maxPeriodoDate: string | null = null;

    points.forEach((p) => {
      if (!p.is_failure && p.value !== null && p.value > maxPeriodoValue) {
        maxPeriodoValue = p.value;
        maxPeriodoDate = p.date;
      }
    });

    const barData = points.map((p: DetailPoint) => {
      const value = p.is_failure ? null : p.value;
      const isPico = p.date === maxPeriodoDate && value !== null; // ignora falhas

      return isPico
        ? { value: [new Date(p.date).getTime(), value], itemStyle: { color: t.primaryDark } }
        : [new Date(p.date).getTime(), value];
    });

    const HALF_DAY_MS = DAY_MS / 2;
    const markAreaData = (failure_windows ?? []).map((w: FailureWindow) => [
      { xAxis: new Date(w.start).getTime() - HALF_DAY_MS },
      { xAxis: new Date(w.end).getTime() + HALF_DAY_MS },
    ]);

    const firstTs = points.length ? new Date(points[0].date).getTime() : 0;
    const lastTs = points.length ? new Date(points[points.length - 1].date).getTime() : 0;
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

    const hasHistoricalMax = annualMaxData.length > 0;
    const legendNameMax = hasHistoricalMax ? CHART_LEGEND_LABELS.maxObservado : null;
    const legendNamePico = CHART_LEGEND_LABELS.maxPeriodo;

    const series: any[] = [
      {
        name: this.seriesName(),
        type: 'bar',
        data: barData,
        barCategoryGap: '1%',
        itemStyle: { color: t.primaryLight, borderRadius: [3, 3, 0, 0] },
        emphasis: { itemStyle: { color: t.primaryMid } },
        markPoint: buildMarkPoint(annualMaxData, t),
        markArea: buildMarkArea(markAreaData, t),
      },
      buildMaxPeriodoLegendSeries(t, CHART_LEGEND_LABELS.maxPeriodo),
    ];

    if (hasHistoricalMax) {
      series.push(buildMaxObservadoLegendSeries(t, CHART_LEGEND_LABELS.maxObservado));
    }

    series.push(buildFalhaLegendSeries(t, 'bar'));

    return {
      textStyle: { fontFamily: t.fontFamily },
      legend: buildLegend(this.seriesName(), legendNameMax, t.primaryLight, t, legendNamePico),
      grid: buildGrid(48),
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
          hideOverlap: true,
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
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          bottom: 10,
          start: 0,
          end: 100,
          height: 16,
          showDataShadow: false,
          borderColor: 'transparent',
          backgroundColor: hexToRgba(t.border, 0.3),
          fillerColor: hexToRgba(t.primaryDark, 0.1),
          handleSize: '120%',
          handleStyle: {
            color: t.primaryDark,
            borderColor: '#fff',
            borderWidth: 1.5,
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
          },
          textStyle: {
            color: t.textMuted,
            fontFamily: t.fontFamily,
          },
          labelFormatter: (value: number) => {
            const d = new Date(value);
            const day = d.getUTCDate().toString().padStart(2, '0');
            const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
        },
      ],
      series,
    };
  }
}
