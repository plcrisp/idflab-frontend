import { EChartsOption } from 'echarts';
import type { SeriesOption } from 'echarts';
import { ChartTokens } from '../../../../../core/services/utils/echarts.service';

export const CHART_LEGEND_LABELS = {
  maxObservado: 'Máximo histórico',
  maxPeriodo: 'Precipitação diária máxima do período',
  falha: 'Cobertura incompleta',
  anoSelecionado: 'Ano selecionado',
} as const;

// color handler

export function hexToRgba(hex: string, alpha: number): string {
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

// legend

export function buildLegend(
  seriesName: string,
  nameMax: string | null,
  seriesColor: string,
  tokens: ChartTokens,
  maxPeriodName: string | null = null,
  selectedYearName: string | null = null, // novo
): EChartsOption['legend'] {
  const data: any[] = [{ name: seriesName, icon: 'roundRect', itemStyle: { color: seriesColor } }];

  if (maxPeriodName) {
    data.push({
      name: maxPeriodName,
      icon: 'roundRect',
      itemStyle: { color: tokens.primaryDark },
    });
  }

  if (selectedYearName) {
    data.push({
      name: selectedYearName,
      icon: 'roundRect',
      itemStyle: { color: tokens.primary },
    });
  }

  if (nameMax) {
    data.push({
      name: nameMax,
      icon: 'circle',
      itemStyle: { color: tokens.historicalMax },
    });
  }

  data.push({
    name: CHART_LEGEND_LABELS.falha,
    icon: 'roundRect',
    itemStyle: {
      color: tokens.incompleteCoverage,
      borderColor: tokens.incompleteBorder,
      borderWidth: 1,
    },
  });

  return {
    type: 'scroll',
    top: 0,
    right: 16,
    itemGap: 16,
    itemWidth: 12,
    itemHeight: 12,
    selectedMode: false,
    data,
    textStyle: {
      color: tokens.textMuted,
      fontFamily: tokens.fontFamily,
      fontSize: 12,
    },
  };
}

// grid

export function buildGrid(bottom: number = 32): EChartsOption['grid'] {
  return { left: 16, right: 16, top: 32, bottom: bottom, containLabel: true };
}

// tooltip

export function buildTooltipBase(tokens: ChartTokens) {
  return {
    trigger: 'axis' as const,
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    padding: [10, 14] as [number, number],
    extraCssText: 'box-shadow: 0 4px 16px rgba(16, 24, 40, 0.12); border-radius: 8px;',
    textStyle: {
      color: tokens.text,
      fontFamily: tokens.fontFamily,
      fontSize: 12,
    },
    axisPointer: {
      type: 'line' as const,
      lineStyle: { color: tokens.border, type: 'dashed' as const },
    },
  };
}

// eixos

export function buildAxisLineStyle(tokens: ChartTokens) {
  return { lineStyle: { color: tokens.border } };
}

export function buildAxisLabelBase(tokens: ChartTokens) {
  return {
    color: tokens.textMuted,
    fontFamily: tokens.fontFamily,
    fontSize: 11,
  };
}

export function buildSplitLineStyle(tokens: ChartTokens) {
  return { lineStyle: { color: tokens.borderSubtle, type: 'dashed' as const } };
}

// markArea

export function buildMarkArea(data: any[], tokens: ChartTokens) {
  return {
    itemStyle: {
      color: tokens.incompleteCoverage,
      borderColor: tokens.incompleteBorder,
      borderWidth: 1,
      borderType: 'dashed' as const,
    },
    data,
  };
}

// markpoint

export function buildMarkPoint(data: any[], tokens: ChartTokens) {
  return {
    symbol: 'circle',
    symbolSize: 10,
    data,
    itemStyle: {
      color: tokens.historicalMax,
      borderColor: tokens.surface,
      borderWidth: 1,
    },
    label: { show: false },
  };
}

// markline

export function buildHistoricalMaxMarkLine(
  maxValue: number | null | undefined,
  tokens: ChartTokens,
  unit: string = 'mm',
) {
  if (maxValue === null || maxValue === undefined || Number.isNaN(maxValue) || maxValue <= 0) {
    return undefined;
  }

  return {
    silent: true,
    symbol: ['none', 'none'] as [string, string],
    animation: true,
    label: { show: false },
    data: [
      {
        name: CHART_LEGEND_LABELS.maxObservado,
        yAxis: maxValue,
        lineStyle: {
          color: tokens.historicalMax,
          type: 'dashed' as const,
          width: 1.2,
          opacity: 0.9,
        },
        label: { show: false },
      },
    ],
  };
}

export function calcYAxisMax(
  extentMax: number,
  historicalMax: number | null | undefined,
  step: number = 50,
): number {
  const target = Math.max(extentMax || 0, historicalMax ?? 0);
  if (target <= 0) return step;
  const rounded = Math.ceil(target / step) * step;
  return rounded - target < 10 ? rounded + step : rounded;
}

// series fantasma

export function buildMaxObservadoLegendSeries(
  tokens: ChartTokens,
  name: string,
  opts: { symbol?: string } = {},
): SeriesOption {
  return {
    name: name,
    type: 'scatter',
    data: [] as any[],
    symbol: opts.symbol ?? 'circle',
    symbolSize: 10,
    itemStyle: { color: tokens.historicalMax },
  };
}

export function buildFalhaLegendSeries(
  tokens: ChartTokens,
  type: 'bar' | 'scatter' = 'bar',
): SeriesOption {
  return {
    name: CHART_LEGEND_LABELS.falha,
    type,
    data: [] as any[],
    itemStyle: {
      color: tokens.incompleteCoverage,
      borderColor: tokens.incompleteBorder,
      borderWidth: 1,
    },
  } as SeriesOption;
}

export function buildMaxPeriodoLegendSeries(tokens: ChartTokens, name: string): SeriesOption {
  return {
    name: name,
    type: 'bar',
    data: [] as any[],
    itemStyle: { color: tokens.primaryDark },
  };
}

export function buildSelectedYearLegendSeries(tokens: ChartTokens, name: string): SeriesOption {
  return {
    name,
    type: 'scatter',
    data: [] as any[],
    itemStyle: { color: tokens.primary },
  };
}
