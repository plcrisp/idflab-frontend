import { EChartsOption } from 'echarts';
import type { SeriesOption } from 'echarts';
import { ChartTokens } from '../../../../../core/services/utils/echarts.service';

export const CHART_LEGEND_LABELS = {
  maxObservado: 'Recorde histórico',
  maxPeriodo: 'Precipitação diária máxima do período',
  falha: 'Cobertura incompleta',
  anoSelecionado: 'Ano selecionado',
} as const;
export const CHART_AXIS_LABEL_COLOR = '#4d4d4d';

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
      itemStyle: { color: tokens.secondary },
    });
  }

  data.push({
    name: CHART_LEGEND_LABELS.falha,
    icon: 'roundRect',
    itemStyle: {
      color: hexToRgba(tokens.error, 0.18),
      borderColor: tokens.error,
      borderWidth: 1,
    },
  });

  return {
    top: 0,
    right: 16,
    itemGap: 24,
    itemWidth: 12,
    itemHeight: 12,
    selectedMode: false,
    data,
    textStyle: {
      color: tokens.textMuted,
      fontFamily: tokens.fontFamily,
      fontSize: 12,
      fontWeight: 'lighter',
    },
  };
}

// grid

export function buildGrid(botom: number = 32): EChartsOption['grid'] {
  return { left: 16, right: 16, top: 32, bottom: botom, containLabel: true };
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
    color: CHART_AXIS_LABEL_COLOR,
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
      color: hexToRgba(tokens.error, 0.1),
      borderColor: tokens.error,
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
      color: tokens.secondary,
      borderColor: tokens.surface,
      borderWidth: 1,
    },
    label: { show: false },
  };
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
    itemStyle: { color: tokens.secondary },
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
      color: hexToRgba(tokens.error, 0.18),
      borderColor: tokens.error,
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
