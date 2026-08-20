import { Component, effect, ElementRef, input, signal, ViewChild } from '@angular/core';
import { CoverageStatus, YearlySummaryItem } from '../../models/initial-visualization.model';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';

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
  selector: 'app-annual-max-overview-chart',
  standalone: false,
  templateUrl: './annual-max-overview-chart.html',
  styleUrl: './annual-max-overview-chart.scss',
})
export class AnnualMaxOverviewChart {
  data = input<YearlySummaryItem[] | null>(null);
  unit = input('mm');
  seriesName = input('Máximo Anual');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private chart?: echarts.ECharts;
  private themeObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private resizeRaf?: number;

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
        this.observeContainerResize();
      }
      this.chart.setOption(this.buildOption(data), true);
    });
  }

  private observeContainerResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.chart?.resize());
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.chart?.dispose();
    this.themeObserver?.disconnect();
    this.resizeObserver?.disconnect();
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
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

  private findGlobalMax(data: YearlySummaryItem[]): YearlySummaryItem | null {
    return data.reduce<YearlySummaryItem | null>((best, item) => {
      if (item.max_value === null) return best;
      if (!best || best.max_value === null || item.max_value > best.max_value) return item;
      return best;
    }, null);
  }

  private buildOption(data: YearlySummaryItem[]): EChartsOption {
    const t = this.getTokens();

    const years = data.map((d) => d.year.toString());
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
        bottom: 32,
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
          axisLine: { lineStyle: { color: t.border } },
          axisTick: { show: false },
          axisLabel: {
            color: '#4d4d4d',
            fontFamily: t.fontFamily,
            fontSize: 11,
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
        interval: 50,
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
          type: 'line',
          xAxisIndex: 1,
          data: [],
          silent: true,
          tooltip: { show: false },
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
        {
          name: this.seriesName(),
          type: 'bar',
          data: barData,
          barCategoryGap: '20%',
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
        },
      ],
    };
  }
}
