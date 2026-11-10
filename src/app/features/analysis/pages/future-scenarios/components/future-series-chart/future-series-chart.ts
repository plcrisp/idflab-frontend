import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EChartsOption } from 'echarts';

import { FutureAnnualMaximumItem } from '../../models/future-scenarios.model';
import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildGrid,
  buildSplitLineStyle,
  buildTooltipBase,
  calcYAxisMax,
} from '../../../initial-visualization/utils/chart-options.utils';

@Component({
  selector: 'app-future-series-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './future-series-chart.html',
  styleUrl: './future-series-chart.scss',
  providers: [EchartsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full min-w-0' },
})
export class FutureSeriesChart implements OnDestroy {
  readonly data = input<FutureAnnualMaximumItem[] | null>(null);
  readonly observedReferenceMean = input<number | null>(null);
  readonly unit = input<string>('mm');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    items: FutureAnnualMaximumItem[];
    observedReferenceMean: number | null;
  }>;

  private readonly chartInput = computed(() => ({
    items: this.data() ?? [],
    observedReferenceMean: this.observedReferenceMean(),
  }));

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.chartInput,
      buildOption: ({ items, observedReferenceMean }) =>
        this.buildOption(items, observedReferenceMean),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(
    items: FutureAnnualMaximumItem[],
    observedMean: number | null,
  ): EChartsOption {
    const tokens = this.echarts.getTokens();

    if (!items || items.length === 0) {
      return {
        grid: buildGrid(32),
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [],
      };
    }

    const allValues: number[] = [];
    for (const item of items) {
      if (item.corrected_mm != null) allValues.push(item.corrected_mm);
      if (item.raw_mm != null) allValues.push(item.raw_mm);
    }
    if (observedMean != null && observedMean > 0) {
      allValues.push(observedMean);
    }
    const maxTarget = allValues.length > 0 ? Math.max(...allValues) : 50;
    const yAxisMax = calcYAxisMax(maxTarget, null, 25);

    const markLineData =
      observedMean != null && observedMean > 0
        ? {
            silent: true,
            symbol: ['none', 'none'] as [string, string],
            lineStyle: {
              color: tokens.historicalMax,
              type: 'dashed' as const,
              width: 1.5,
            },
            data: [{ yAxis: observedMean, name: 'Média observada (referência)' }],
            label: { show: false },
          }
        : undefined;

    return {
      grid: {
        left: 16,
        right: 16,
        top: 36,
        bottom: 28,
        containLabel: true,
      },
      legend: {
        type: 'scroll',
        top: 0,
        right: 16,
        itemGap: 16,
        itemWidth: 14,
        itemHeight: 10,
        selectedMode: false,
        data: [
          {
            name: 'Máxima diária anual (corrigido)',
            icon: 'roundRect',
            itemStyle: { color: tokens.chartBarOverview },
          },
          {
            name: 'Modelo bruto',
            icon: 'circle',
            itemStyle: {
              color: tokens.surface,
              borderColor: tokens.secondary,
              borderWidth: 2,
            },
          },
          {
            name: 'Média observada (referência)',
            icon: 'line',
            itemStyle: { color: tokens.historicalMax },
            lineStyle: { type: 'dashed' as const, width: 2 },
          },
        ],
        textStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 12,
        },
      },
      tooltip: {
        ...buildTooltipBase(tokens),
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: tokens.border,
            opacity: 0.15,
          },
        },
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          const yearStr = list[0]?.axisValue;
          const item = items.find((d) => d.year === Number(yearStr));
          if (!item) return '';

          const rawVal = item.raw_mm;
          const corrVal = item.corrected_mm;
          const diff = corrVal - rawVal;
          const diffSign = diff > 0 ? '+' : '';
          const pct = rawVal > 0 ? (diff / rawVal) * 100 : 0;
          const pctSign = pct > 0 ? '+' : '';

          const rawFmt = rawVal.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
          const corrFmt = corrVal.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
          const diffFmt =
            diffSign +
            diff.toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
          const pctFmt =
            pctSign +
            pct.toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }) +
            '%';

          return `
            <div style="font-size: 12px; font-family: ${tokens.fontFamily}; min-width: 175px;">
              <div style="font-weight: 600; color: ${tokens.text}; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid ${tokens.border};">
                Ano ${item.year}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 12px;">
                <span style="color: ${tokens.textMuted};">Corrigido:</span>
                <span style="font-weight: 600; color: ${tokens.text}; font-variant-numeric: tabular-nums;">${corrFmt} mm</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 12px;">
                <span style="color: ${tokens.textMuted};">Modelo bruto:</span>
                <span style="font-weight: 600; color: ${tokens.text}; font-variant-numeric: tabular-nums;">${rawFmt} mm</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 4px; border-top: 1px dashed ${tokens.border}; gap: 12px;">
                <span style="color: ${tokens.textMuted};">Diferença:</span>
                <span style="font-weight: 600; color: ${diff >= 0 ? tokens.primary : tokens.error}; font-variant-numeric: tabular-nums;">${diffFmt} mm (${pctFmt})</span>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: items.map((d) => d.year),
        axisLine: buildAxisLineStyle(tokens),
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          interval: 'auto',
          hideOverlap: true,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yAxisMax,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          formatter: '{value} mm',
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [
        {
          name: 'Máxima diária anual (corrigido)',
          type: 'bar',
          data: items.map((d) => d.corrected_mm),
          barMaxWidth: 16,
          itemStyle: {
            color: tokens.chartBarOverview,
            borderRadius: [3, 3, 0, 0],
          },
          markLine: markLineData,
          z: 2,
        },
        {
          name: 'Modelo bruto',
          type: 'scatter',
          data: items.map((d) => d.raw_mm),
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: tokens.surface,
            borderColor: tokens.secondary,
            borderWidth: 2,
          },
          z: 10,
        },
        {
          name: 'Média observada (referência)',
          type: 'line',
          data: [],
          lineStyle: {
            color: tokens.historicalMax,
            type: 'dashed' as const,
            width: 1.5,
          },
          itemStyle: {
            color: tokens.historicalMax,
          },
        },
      ],
    };
  }
}
