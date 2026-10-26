import { Component, computed, ElementRef, inject, input, OnDestroy, ViewChild } from '@angular/core';
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
  buildFilledDataLegendSeries,
  buildGrid,
  buildHistoricalMaxMarkLine,
  buildHistoricalMaxMarkPointItem,
  buildLegend,
  buildMarkArea,
  buildMarkPoint,
  buildMaxObservadoLegendSeries,
  buildMaxPeriodoLegendSeries,
  buildPeriodMaxMarkPointItem,
  buildSplitLineStyle,
  buildTooltipBase,
  calcYAxisMax,
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
  standalone: true,
  templateUrl: './time-series-detail-chart.html',
  styleUrl: './time-series-detail-chart.scss',
  providers: [EchartsService],
  host: { class: 'block w-full min-w-0' },
})
export class TimeSeriesDetailChart implements OnDestroy {
  data = input<DetailResponse | null>(null);
  unit = input('mm');
  seriesName = input('Precipitação diária');
  historicalMaxDate = input<string | null>(null);
  historicalMaxValue = input<number | null>(null);

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    detail: DetailResponse | null;
    historicalMaxDate: string | null;
    historicalMaxValue: number | null;
  }>;

  private currentMaxPeriodoDate: string | null = null;

  private readonly chartInput = computed(() => ({
    detail: this.data(),
    historicalMaxDate: this.historicalMaxDate(),
    historicalMaxValue: this.historicalMaxValue(),
  }));

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.chartInput,
      buildOption: ({ detail, historicalMaxDate, historicalMaxValue }) =>
        detail ? this.buildOption(detail, historicalMaxDate, historicalMaxValue) : {},
      onDataZoom: (params) => this.onDataZoom(params),
      renderer: 'canvas',
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private onDataZoom(params: any): void {
    const detail = this.data();
    if (!detail?.points?.length) return;

    const start = params?.batch ? params.batch[0]?.start : params?.start;
    const end = params?.batch ? params.batch[0]?.end : params?.end;
    if (start == null || end == null) return;

    const points = detail.points;
    const firstTs = new Date(points[0].date).getTime();
    const lastTs = new Date(points[points.length - 1].date).getTime();
    const currentStartTs = firstTs + (lastTs - firstTs) * (start / 100);
    const currentEndTs = firstTs + (lastTs - firstTs) * (end / 100);

    let newMaxDate: string | null = null;
    let newMaxValue = -Infinity;

    points.forEach((p) => {
      const ts = new Date(p.date).getTime();
      if (ts >= currentStartTs - 1000 && ts <= currentEndTs + 1000) {
        if (!p.is_failure && p.value !== null && p.value > newMaxValue) {
          newMaxValue = p.value;
          newMaxDate = p.date;
        }
      }
    });

    if (newMaxDate === this.currentMaxPeriodoDate) return;
    this.currentMaxPeriodoDate = newMaxDate;

    const t = this.echarts.getTokens();
    const series = this.buildSeries(
      detail,
      newMaxDate,
      newMaxValue,
      this.historicalMaxDate(),
      this.historicalMaxValue(),
      t,
    );
    this.echarts.getInstance()?.setOption({ series }, false);
  }

  private buildSeries(
    data: DetailResponse,
    maxPeriodoDate: string | null,
    maxPeriodoValue: number,
    historicalMaxDate: string | null,
    historicalMaxValue: number | null,
    t: any,
  ): any[] {
    const { points, failure_windows } = data;
    const isHourLevel = data.aggregation_level === 'hour';
    const isHighVolume = points.length >= 1000;

    const defaultSeriesName =
      data.aggregation_level === 'hour'
        ? 'Precipitação horária'
        : data.aggregation_level === 'month'
          ? 'Precipitação mensal'
          : 'Precipitação diária';
    const seriesName =
      this.seriesName() !== 'Precipitação diária' ? this.seriesName() : defaultSeriesName;

    const legendNamePico =
      data.aggregation_level === 'hour'
        ? 'Precipitação horária máxima do período'
        : data.aggregation_level === 'month'
          ? 'Precipitação mensal máxima do período'
          : 'Precipitação diária máxima do período';

    const historicalMaxRef = historicalMaxDate ? new Date(historicalMaxDate) : null;

    const annualMaxData = historicalMaxRef
      ? points
        .filter((p) => {
          if (p.value === null || p.is_failure) return false;
          const pDate = new Date(p.date);
          if (isHourLevel) {
            return pDate.getTime() === historicalMaxRef.getTime();
          }
          return isSameUTCDate(pDate, historicalMaxRef);
        })
        .map((p) => ({
          name: CHART_LEGEND_LABELS.maxObservado,
          coord: [new Date(p.date).getTime(), p.value] as [number, number],
        }))
      : [];

    const isCoincident =
      historicalMaxRef !== null &&
      maxPeriodoDate !== null &&
      annualMaxData.length > 0 &&
      (isHourLevel
        ? new Date(maxPeriodoDate).getTime() === historicalMaxRef.getTime()
        : isSameUTCDate(new Date(maxPeriodoDate), historicalMaxRef));

    const markPointItems: any[] = [];
    if (annualMaxData.length > 0) {
      markPointItems.push(buildHistoricalMaxMarkPointItem(annualMaxData[0].coord, t));
    }
    if (!isCoincident && maxPeriodoDate !== null && maxPeriodoValue > -Infinity) {
      markPointItems.push(
        buildPeriodMaxMarkPointItem(
          [new Date(maxPeriodoDate).getTime(), maxPeriodoValue],
          t,
          legendNamePico,
        ),
      );
    }

    const hasFilledData = points.some((p: DetailPoint) => !p.is_failure && p.is_filled === true);

    const barData = points.map((p: DetailPoint) => {
      const value = p.is_failure ? null : p.value;
      const isFilled = !p.is_failure && p.is_filled === true;
      const isPico = !isHighVolume && p.date === maxPeriodoDate && value !== null;

      let color = t.chartBarDetail;
      if (isFilled) {
        color = t.chartBarFilled;
      } else if (isPico) {
        color = t.primaryDark;
      }

      return {
        value: [new Date(p.date).getTime(), value],
        itemStyle: { color, borderRadius: [3, 3, 0, 0] },
        isFilled,
        isPico,
      };
    });

    const offsetMs = isHourLevel ? 30 * 60 * 1000 : DAY_MS / 2;
    const markAreaData = (failure_windows ?? []).map((w: FailureWindow) => [
      { xAxis: new Date(w.start).getTime() - offsetMs },
      { xAxis: new Date(w.end).getTime() + offsetMs },
    ]);

    const histMax =
      historicalMaxValue ??
      (annualMaxData.length > 0 ? (annualMaxData[0].coord[1] as number) : null);

    const hasHistoricalMax = histMax !== null && histMax !== undefined;

    const baseSeries: any = isHighVolume
      ? {
        name: seriesName,
        type: 'line',
        large: true,
        largeThreshold: 2000,
        sampling: 'lttb',
        symbol: 'none',
        data: barData,
        lineStyle: { color: t.chartBarDetail, width: 1.5 },
        itemStyle: { color: t.chartBarDetail },
        markPoint: buildMarkPoint(markPointItems, t),
        markArea: buildMarkArea(markAreaData, t),
        markLine: buildHistoricalMaxMarkLine(histMax, t, this.unit()),
      }
      : {
        name: seriesName,
        type: 'bar',
        data: barData,
        barCategoryGap: '10%',
        barGap: '-100%',
        itemStyle: { color: t.chartBarDetail, borderRadius: [3, 3, 0, 0] },
        emphasis: { itemStyle: { color: t.primaryMid } },
        markPoint: buildMarkPoint(markPointItems, t),
        markArea: buildMarkArea(markAreaData, t),
        markLine: buildHistoricalMaxMarkLine(histMax, t, this.unit()),
      };

    const series: any[] = [
      baseSeries,
      buildMaxPeriodoLegendSeries(t, legendNamePico),
    ];

    if (hasFilledData) {
      series.push(buildFilledDataLegendSeries(t, CHART_LEGEND_LABELS.dadoPreenchido));
    }

    if (hasHistoricalMax) {
      series.push(buildMaxObservadoLegendSeries(t, CHART_LEGEND_LABELS.maxObservado));
    }

    series.push(buildFalhaLegendSeries(t, isHighVolume ? 'scatter' : 'bar'));

    return series;
  }

  private buildOption(
    data: DetailResponse,
    historicalMaxDate: string | null,
    historicalMaxValue: number | null,
  ): EChartsOption {
    const { points } = data;
    const t = this.echarts.getTokens();

    const isHourLevel = data.aggregation_level === 'hour';

    const defaultSeriesName =
      data.aggregation_level === 'hour'
        ? 'Precipitação horária'
        : data.aggregation_level === 'month'
          ? 'Precipitação mensal'
          : 'Precipitação diária';
    const seriesName =
      this.seriesName() !== 'Precipitação diária' ? this.seriesName() : defaultSeriesName;

    const legendNamePico =
      data.aggregation_level === 'hour'
        ? 'Precipitação horária máxima do período'
        : data.aggregation_level === 'month'
          ? 'Precipitação mensal máxima do período'
          : 'Precipitação diária máxima do período';

    let maxPeriodoValue = -Infinity;
    let maxPeriodoDate: string | null = null;

    points.forEach((p) => {
      if (!p.is_failure && p.value !== null && p.value > maxPeriodoValue) {
        maxPeriodoValue = p.value;
        maxPeriodoDate = p.date;
      }
    });

    this.currentMaxPeriodoDate = maxPeriodoDate;

    const hasFilledData = points.some((p: DetailPoint) => !p.is_failure && p.is_filled === true);

    const tickValues: number[] = [];
    if (!isHourLevel && points.length > 0) {
      const firstTs = new Date(points[0].date).getTime();
      const lastTs = new Date(points[points.length - 1].date).getTime();
      const spanDays = (lastTs - firstTs) / DAY_MS;

      const tickStepDays =
        spanDays <= 21 ? 2 : spanDays <= 45 ? 5 : spanDays <= 90 ? 7 : spanDays <= 180 ? 14 : 30;
      const tickInterval = tickStepDays * DAY_MS;

      for (let ts = firstTs; ts <= lastTs; ts += tickInterval) {
        tickValues.push(ts);
      }
      if (tickValues[tickValues.length - 1] !== lastTs) {
        tickValues.push(lastTs);
      }
    }

    const historicalMaxRef = historicalMaxDate ? new Date(historicalMaxDate) : null;
    const histMaxInPoints = historicalMaxRef
      ? points.find((p) => {
          if (p.value === null || p.is_failure) return false;
          const pDate = new Date(p.date);
          return isHourLevel
            ? pDate.getTime() === historicalMaxRef.getTime()
            : isSameUTCDate(pDate, historicalMaxRef);
        })?.value ?? null
      : null;

    const histMax = historicalMaxValue ?? histMaxInPoints;
    const hasHistoricalMax = histMax !== null && histMax !== undefined;
    const legendNameMax = hasHistoricalMax ? CHART_LEGEND_LABELS.maxObservado : null;

    const series = this.buildSeries(
      data,
      maxPeriodoDate,
      maxPeriodoValue,
      historicalMaxDate,
      historicalMaxValue,
      t,
    );

    return {
      useUTC: true,
      textStyle: { fontFamily: t.fontFamily },
      legend: buildLegend(
        seriesName,
        legendNameMax,
        t.chartBarDetail,
        t,
        legendNamePico,
        null,
        hasFilledData ? CHART_LEGEND_LABELS.dadoPreenchido : null,
      ),
      grid: buildGrid(48),
      tooltip: {
        ...buildTooltipBase(t),
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const timestamp = Array.isArray(p.value) ? p.value[0] : p.axisValue;
          const value = Array.isArray(p.value) ? p.value[1] : p.data;
          const date = new Date(timestamp);
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          let dateLabel = `${day}/${month}/${year}`;
          if (isHourLevel) {
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            dateLabel += ` ${hours}:${minutes}`;
          }
          const isFilled = p?.data?.isFilled ?? false;
          const isPico = p?.data?.isPico ?? false;

          let valueLabel: string;
          if (value === null || value === undefined) {
            valueLabel = 'Sem dado registrado';
          } else if (isFilled && isPico) {
            valueLabel = `<span style="color:${t.chartBarFilled};font-weight:600;">Valor preenchido</span> <span style="font-weight:600;">(Máxima do período):</span> ${value.toLocaleString('pt-BR')} ${this.unit()}`;
          } else if (isFilled) {
            valueLabel = `<span style="color:${t.chartBarFilled};font-weight:600;">Valor preenchido:</span> ${value.toLocaleString('pt-BR')} ${this.unit()}`;
          } else if (isPico) {
            valueLabel = `<span style="color:${t.primaryDark};font-weight:600;">Máxima do período:</span> ${value.toLocaleString('pt-BR')} ${this.unit()}`;
          } else {
            valueLabel = `${value.toLocaleString('pt-BR')} ${this.unit()}`;
          }
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
          hideOverlap: true,
          ...(isHourLevel
            ? {
              formatter: {
                year: '{yyyy}',
                month: '{MMM}',
                day: '{d} {MMM}',
                hour: '{HH}:{mm}',
                minute: '{HH}:{mm}',
              },
            }
            : {
              customValues: tickValues,
              formatter: (value: number) => {
                const d = new Date(value);
                const day = d.getUTCDate();
                const month = MONTHS_PT[d.getUTCMonth()];
                return `${day} ${month}`;
              },
            }),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        interval: 50,
        max: (extent: { min: number; max: number }) => calcYAxisMax(extent.max, histMax, 50),
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
            borderColor: t.surface,
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
