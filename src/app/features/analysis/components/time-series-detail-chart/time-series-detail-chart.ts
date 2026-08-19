import {
  Component,
  effect,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import {
  DetailPoint,
  DetailResponse,
  FailureWindow,
} from '../../models/initial-visualization.model';

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

interface ChartTokens {
  fontFamily: string;
  surface: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryDark: string;
  primaryMid: string;
  error: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

@Component({
  selector: 'app-time-series-detail-chart',
  standalone: false,
  templateUrl: './time-series-detail-chart.html',
  styleUrl: './time-series-detail-chart.scss',
})
export class TimeSeriesDetailChart implements OnDestroy {
  data = input<DetailResponse | null>(null);
  unit = input('mm');
  seriesName = input('Precipitação diária');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private chart?: echarts.ECharts;
  private themeObserver?: MutationObserver;

  private readonly themeTick = signal(0);

  constructor() {
    this.themeObserver = new MutationObserver(() => this.themeTick.update((v) => v + 1));
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    effect(() => {
      const data = this.data();
      this.themeTick();
      if (!data) return;

      if (!this.chart) {
        this.chart = echarts.init(this.chartContainer.nativeElement);
      }
      this.chart.setOption(this.buildOption(data), true);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.chart?.resize();
  }

  ngOnDestroy(): void {
    this.chart?.dispose();
    this.themeObserver?.disconnect();
  }

  private getTokens(): ChartTokens {
    const styles = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

    return {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      surface: v('--surface', '#ffffff'),
      border: v('--border', '#d1d5db'),
      borderSubtle: v('--border-subtle', 'rgba(0, 0, 0, 0.07)'),
      text: v('--text', '#1f1f1f'),
      textMuted: v('--text-muted', '#1f1f1f'),
      textSubtle: v('--text-subtle', 'rgba(13, 13, 13, 0.4)'),
      primary: v('--primary', '#49628b'),
      primaryMid: v('--color-primary-700', '#2a3c58'),
      primaryDark: v('--color-primary-800', '#1e2a3f'),
      error: v('--color-error', '#ef4444'),
    };
  }

  private buildOption(data: DetailResponse): EChartsOption {
    const { points, failure_windows } = data;
    const t = this.getTokens();

    const dates = points.map((p: DetailPoint) => p.date);
    const barData = points.map((p: DetailPoint) => (p.is_failure ? null : p.value));

    const annualMaxData = points
      .filter((p) => p.is_annual_max)
      .map((p) => ({
        name: 'Máximo anual',
        coord: [p.date, p.value] as [string, number],
      }));

    const markAreaData = (failure_windows ?? []).map((w: FailureWindow) => [
      { xAxis: w.start },
      { xAxis: w.end },
    ]);

    const labelStepDays = 7;

    return {
      textStyle: {
        fontFamily: t.fontFamily,
      },
      legend: {
        top: 0,
        right: 0,
        itemGap: 24,
        itemWidth: 12,
        itemHeight: 12,
        selectedMode: false,
        data: [
          {
            name: this.seriesName(),
            icon: 'roundRect',
            itemStyle: { color: t.primary },
          },
          {
            name: 'Máximo anual',
            icon: 'circle',
            itemStyle: { color: t.primaryDark },
          },
          {
            name: 'Falha / sem dados',
            icon: 'roundRect',
            itemStyle: {
              color: hexToRgba(t.error, 0.18),
              borderColor: t.error,
              borderWidth: 1,
            },
          },
        ],
        textStyle: {
          color: t.textMuted,
          fontFamily: t.fontFamily,
          fontSize: 12,
        },
      },
      grid: {
        left: 8,
        right: 8,
        top: 32,
        bottom: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: t.surface,
        borderColor: t.border,
        borderWidth: 1,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 4px 16px rgba(16, 24, 40, 0.12); border-radius: 8px;',
        textStyle: {
          color: t.text,
          fontFamily: t.fontFamily,
          fontSize: 12,
        },
        axisPointer: {
          type: 'line',
          lineStyle: { color: t.border, type: 'dashed' },
        },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const date = new Date(p.axisValue);
          const dateLabel = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
          const value = p.data;
          const valueLabel =
            value === null || value === undefined
              ? 'Sem dado registrado'
              : `${value.toLocaleString('pt-BR')} ${this.unit()}`;
          return `<div style="font-weight:600;margin-bottom:2px;">${dateLabel}</div>${valueLabel}`;
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: t.border } },
        axisTick: { show: false },
        axisLabel: {
          color: '#4d4d4d',
          fontFamily: t.fontFamily,
          fontSize: 11,
          margin: 12,
          // Mostra 1 label a cada `labelStepDays` pontos
          interval: (index: number) => index % labelStepDays === 0,
          formatter: (value: string) => {
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
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: t.borderSubtle, type: 'dashed' },
        },
        axisLabel: {
          color: '#4d4d4d',
          fontFamily: t.fontFamily,
          fontSize: 11,
          formatter: `{value} ${this.unit()}`,
        },
      },
      series: [
        {
          name: this.seriesName(),
          type: 'bar',
          data: barData,
          barMaxWidth: 6,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: t.primary },
              { offset: 1, color: t.primaryMid },
            ]),
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: {
            itemStyle: { color: t.primaryDark },
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 10,
            data: annualMaxData,
            itemStyle: {
              color: t.primaryDark,
              borderColor: t.surface,
              borderWidth: 1.5,
            },
            label: { show: false },
          },
          markArea: {
            itemStyle: {
              color: hexToRgba(t.error, 0.1),
              borderColor: t.error,
              borderWidth: 1,
              borderType: 'dashed',
            },
            data: markAreaData as any,
          },
        },
      ],
    };
  }
}
