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

function buildDashedLineLegendIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="10" viewBox="0 0 16 10"><line x1="0" y1="5" x2="16" y2="5" stroke="${color}" stroke-width="2" stroke-dasharray="3,2"/></svg>`;
  return `image://data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildLineWithDotLegendIcon(color: string, surfaceColor: string = '#ffffff'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="10" viewBox="0 0 16 10"><line x1="0" y1="5" x2="16" y2="5" stroke="${color}" stroke-width="2"/><circle cx="8" cy="5" r="2.5" fill="${color}" stroke="${surfaceColor}" stroke-width="1"/></svg>`;
  return `image://data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
  readonly modelColor = input<string>('#3b82f6');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    items: FutureAnnualMaximumItem[];
    observedReferenceMean: number | null;
    modelColor: string;
  }>;

  private readonly chartInput = computed(() => ({
    items: this.data() ?? [],
    observedReferenceMean: this.observedReferenceMean(),
    modelColor: this.modelColor(),
  }));

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.chartInput,
      buildOption: ({ items, observedReferenceMean, modelColor }) =>
        this.buildOption(items, observedReferenceMean, modelColor),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(
    items: FutureAnnualMaximumItem[],
    observedMean: number | null,
    modelColor: string = '#3b82f6',
  ): EChartsOption {
    const tokens = this.echarts.getTokens();
    const activeModelColor = modelColor || '#3b82f6';

    if (!items || items.length === 0) {
      return {
        grid: buildGrid(32),
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [],
      };
    }

    const count = items.length;
    const targetLabels = 8;
    const labelStep = count <= targetLabels ? 1 : Math.ceil(count / targetLabels);

    const allValues: number[] = [];
    for (const item of items) {
      if (item.corrected_mm != null) allValues.push(item.corrected_mm);
      if (item.raw_mm != null) allValues.push(item.raw_mm);
    }
    if (observedMean != null && observedMean > 0) {
      allValues.push(observedMean);
    }
    const maxTarget = allValues.length > 0 ? Math.max(...allValues) : 50;
    const step = maxTarget <= 60 ? 10 : maxTarget <= 120 ? 20 : 50;
    const yAxisMax = calcYAxisMax(maxTarget, null, step);

    const markLineData =
      observedMean != null && observedMean > 0
        ? {
            silent: true,
            symbol: ['none', 'none'] as [string, string],
            data: [
              {
                name: 'Média observada (referência)',
                yAxis: observedMean,
                lineStyle: {
                  color: tokens.historicalMax,
                  type: 'dashed' as const,
                  width: 1.5,
                  opacity: 0.95,
                },
                label: { show: false },
              },
            ],
          }
        : undefined;

    return {
      useUTC: true,
      textStyle: { fontFamily: tokens.fontFamily },
      grid: {
        left: 16,
        right: 16,
        top: 36,
        bottom: 16,
        containLabel: true,
      },
      legend: {
        type: 'scroll',
        top: 0,
        right: 16,
        itemGap: 16,
        itemWidth: 16,
        itemHeight: 10,
        selectedMode: false,
        data: [
          {
            name: 'Máxima diária anual (corrigido)',
            icon: 'roundRect',
            itemStyle: { color: tokens.primaryDark },
          },
          {
            name: 'Modelo bruto',
            icon: buildLineWithDotLegendIcon(activeModelColor, tokens.surface),
          },
          ...(observedMean != null && observedMean > 0
            ? [
                {
                  name: 'Média observada (referência)',
                  icon: buildDashedLineLegendIcon(tokens.historicalMax),
                },
              ]
            : []),
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
        data: items.map((d) => d.year.toString()),
        axisLine: buildAxisLineStyle(tokens),
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          margin: 12,
          hideOverlap: true,
          interval: (index: number) => index === 0 || index % labelStep === 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        interval: step,
        max: yAxisMax,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          hideOverlap: true,
          formatter: (value: number) => `${Math.round(value).toLocaleString('pt-BR')} mm`,
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [
        {
          name: 'Máxima diária anual (corrigido)',
          type: 'bar',
          data: items.map((d) => d.corrected_mm),
          barMaxWidth: 16,
          barCategoryGap: '20%',
          itemStyle: {
            color: tokens.primaryDark,
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: {
            itemStyle: { color: tokens.primaryMid },
          },
          markLine: markLineData,
          z: 2,
        },
        {
          name: 'Modelo bruto',
          type: 'line',
          data: items.map((d) => d.raw_mm),
          smooth: 0.15,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: {
            color: activeModelColor,
            borderColor: tokens.surface,
            borderWidth: 1,
          },
          lineStyle: {
            color: activeModelColor,
            width: 2,
          },
          z: 10,
        },
        ...(observedMean != null && observedMean > 0
          ? [
              {
                name: 'Média dos máximos da série observada (referência)',
                type: 'line' as const,
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
            ]
          : []),
      ],
    };
  }
}
