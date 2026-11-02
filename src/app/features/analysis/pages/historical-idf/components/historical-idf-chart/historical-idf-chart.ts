import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EChartsOption, SeriesOption } from 'echarts';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import { HistoricalIdfResponse } from '../../models/historical-idf.model';
import { getHistoricalIdfTrColor } from '../../constants/historical-idf.constants';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildSplitLineStyle,
  buildTooltipBase,
} from '../../../initial-visualization/utils/chart-options.utils';

@Component({
  selector: 'app-historical-idf-chart',
  standalone: true,
  imports: [CommonModule, ...HlmSkeletonImports],
  providers: [EchartsService],
  templateUrl: './historical-idf-chart.html',
  styleUrl: './historical-idf-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalIdfChart implements OnDestroy {
  readonly data = input<HistoricalIdfResponse | null>(null);
  readonly scale = input<'log' | 'linear'>('linear');
  readonly loading = input<boolean>(false);

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    data: HistoricalIdfResponse;
    scale: 'log' | 'linear';
  }>;

  private readonly chartData = computed(() => {
    const d = this.data();
    if (!d || this.loading()) return null;
    return {
      data: d,
      scale: this.scale(),
    };
  });

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer?.nativeElement,
      data: this.chartData,
      buildOption: (payload) => this.buildOption(payload),
    });

    effect(() => {
      this.scale();
      this.echarts.getInstance()?.dispatchAction({ type: 'hideTip' });
    });
  }

  private formatSignedPercentage(fraction: number | null | undefined): string {
    if (fraction == null || Number.isNaN(fraction)) return '0,0%';
    const pct = fraction * 100;
    const sign = pct > 0.0001 ? '+' : pct < -0.0001 ? '−' : '';
    const absFmt = Math.abs(pct).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${sign}${absFmt}%`;
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(payload: {
    data: HistoricalIdfResponse;
    scale: 'log' | 'linear';
  }): EChartsOption {
    const tokens = this.echarts.getTokens();
    const { data, scale } = payload;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const isLog = scale === 'log';

    const durations = data.durations ?? [];
    const firstDur = durations.length > 0 ? durations[0].duration_minutes : 5;
    const lastDur = durations.length > 0 ? durations[durations.length - 1].duration_minutes : 1440;

    const durationMap: Record<number, string> = {};
    durations.forEach((d) => {
      durationMap[d.duration_minutes] = d.label;
    });

    const seriesList: SeriesOption[] = [];
    const legendData: {
      name: string;
      icon?: string;
      itemStyle?: { color: string; borderColor?: string; borderWidth?: number };
    }[] = [];

    // Séries por tempo de retorno (TR)
    for (const tr of data.return_periods) {
      const seriesName = `TR ${tr} anos`;
      const color = getHistoricalIdfTrColor(tr, isLight);

      legendData.push({
        name: seriesName,
        icon: 'roundRect',
        itemStyle: { color },
      });

      // 1. Curva contínua da equação calculada via dense_grid
      const denseDurations = data.dense_grid?.durations_minutes ?? [];
      const denseIntensities = data.dense_grid?.intensities_mm_h?.[String(tr)] ?? [];
      const lineData: [number, number][] = denseDurations.map((d, i) => [
        d,
        denseIntensities[i] ?? 0,
      ]);

      seriesList.push({
        name: seriesName,
        type: 'line',
        data: lineData,
        symbol: 'none',
        smooth: false,
        triggerLineEvent: true,
        lineStyle: {
          width: 2.5,
          color,
        },
        emphasis: {
          lineStyle: {
            width: 3.5,
          },
        },
        cursor: 'pointer',
        z: 2,
      });

      // Buffer de hover transparente para facilitar captura ao passar o mouse sobre a curva
      seriesList.push({
        name: seriesName,
        type: 'line',
        data: lineData,
        symbol: 'none',
        smooth: false,
        triggerLineEvent: true,
        lineStyle: {
          width: 14,
          color: 'transparent',
        },
        emphasis: {
          lineStyle: {
            width: 14,
            color: 'transparent',
          },
        },
        cursor: 'pointer',
        z: 3,
      });

      // 2. Pontos de quantil da distribuição ajustada (visíveis somente na escala Log-log)
      if (isLog) {
        const quantiles = data.quantiles_mm_h?.[String(tr)] ?? [];
        const scatterData: [number, number][] = durations.map((d, idx) => [
          d.duration_minutes,
          quantiles[idx] ?? 0,
        ]);

        seriesList.push({
          name: seriesName,
          type: 'scatter',
          data: scatterData,
          symbol: 'circle',
          symbolSize: 7,
          emphasis: {
            scale: 1.4,
          },
          cursor: 'pointer',
          itemStyle: {
            color: color,
            borderColor: tokens.surface,
            borderWidth: 1.5,
          },
          z: 5,
        });
      }
    }

    // Indicador visual na legenda para o quantil da distribuição (apenas na escala Log-log)
    if (isLog) {
      legendData.push({
        name: 'Quantil da distribuição',
        icon: 'circle',
        itemStyle: {
          color: tokens.textMuted,
          borderColor: tokens.surface,
          borderWidth: 1,
        },
      });

      seriesList.push({
        name: 'Quantil da distribuição',
        type: 'scatter',
        data: [],
        symbol: 'circle',
        silent: true,
        itemStyle: {
          color: tokens.textMuted,
          borderColor: tokens.surface,
          borderWidth: 1,
        },
      });
    }

    return {
      grid: {
        left: 32,
        right: 24,
        top: 48,
        bottom: 36,
        containLabel: true,
      },
      legend: {
        show: true,
        top: 4,
        right: 12,
        itemGap: 14,
        itemWidth: 14,
        itemHeight: 7,
        selectedMode: true,
        textStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
        },
        data: legendData,
      },
      tooltip: {
        ...buildTooltipBase(tokens),
        trigger: 'item',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p || !p.seriesName || p.seriesName === 'Quantil da distribuição') return '';

          const trMatch = p.seriesName.match(/\d+/);
          if (!trMatch) return '';
          const tr = trMatch[0];

          const rawX = Array.isArray(p.value) ? p.value[0] : p.value;
          const durNum = Number(rawX);
          if (isNaN(durNum)) return '';

          // Detecção por proximidade ao eixo X: localiza a duração da etapa mais próxima
          let closestDur = durations[0];
          let minDiff = Infinity;
          for (const d of durations) {
            const diff = isLog
              ? Math.abs(Math.log(d.duration_minutes) - Math.log(durNum))
              : Math.abs(d.duration_minutes - durNum);
            if (diff < minDiff) {
              minDiff = diff;
              closestDur = d;
            }
          }

          const durLabel = closestDur ? closestDur.label : `${durNum} min`;
          const durIdx = closestDur
            ? durations.findIndex((d) => d.duration_minutes === closestDur.duration_minutes)
            : -1;

          const eqVal = durIdx !== -1 ? (data.equation_mm_h[tr]?.[durIdx] ?? null) : null;
          const qVal = durIdx !== -1 ? (data.quantiles_mm_h[tr]?.[durIdx] ?? null) : null;
          const errVal = durIdx !== -1 ? (data.relative_error[tr]?.[durIdx] ?? null) : null;

          const eqFmt =
            eqVal != null
              ? eqVal.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }) + ' mm/h'
              : '—';
          const qFmt =
            qVal != null
              ? qVal.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }) + ' mm/h'
              : '—';
          const errFmt =
            errVal != null
              ? this.formatSignedPercentage(errVal)
              : '—';

          return `
            <div style="font-family: ${tokens.fontFamily}; width: 190px; padding: 2px; box-sizing: border-box; user-select: none;">
              <div style="font-weight: 600; color: ${tokens.text}; font-size: 12px; border-bottom: 1px solid ${tokens.border}; padding-bottom: 5px; margin-bottom: 6px;">
                TR ${tr} · ${durLabel}
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span style="color: ${tokens.textMuted};">Equação:</span>
                  <strong style="color: ${tokens.text}; font-weight: 600; font-variant-numeric: tabular-nums;">${eqFmt}</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span style="color: ${tokens.textMuted};">Quantil:</span>
                  <strong style="color: ${tokens.text}; font-weight: 600; font-variant-numeric: tabular-nums;">${qFmt}</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span style="color: ${tokens.textMuted};">Erro relativo:</span>
                  <strong style="color: ${tokens.text}; font-weight: 600; font-variant-numeric: tabular-nums;">${errFmt}</strong>
                </div>
              </div>
            </div>
          `;
        },
      },
      xAxis: isLog
        ? {
          type: 'log',
          min: firstDur,
          max: lastDur,
          name: 'Duração',
          nameLocation: 'middle',
          nameGap: 26,
          nameTextStyle: {
            color: tokens.textMuted,
            fontFamily: tokens.fontFamily,
            fontSize: 11,
            fontWeight: 500,
          },
          axisLine: buildAxisLineStyle(tokens),
          axisTick: {
            show: true,
            lineStyle: { color: tokens.border },
            customValues: durations.map((d) => d.duration_minutes),
          },
          axisLabel: {
            ...buildAxisLabelBase(tokens),
            customValues: durations.map((d) => d.duration_minutes),
            formatter: (val: number) =>
              durationMap[val] ??
              (val >= 60 && val % 60 === 0 ? `${val / 60} h` : `${val} min`),
          },
          splitLine: buildSplitLineStyle(tokens),
        }
        : {
          type: 'value',
          min: 0,
          max: lastDur,
          name: 'Duração',
          nameLocation: 'middle',
          nameGap: 26,
          nameTextStyle: {
            color: tokens.textMuted,
            fontFamily: tokens.fontFamily,
            fontSize: 11,
            fontWeight: 500,
          },
          axisLine: buildAxisLineStyle(tokens),
          axisLabel: {
            ...buildAxisLabelBase(tokens),
            formatter: (val: number) => {
              if (val === 0) return '0';
              if (val >= 60 && val % 60 === 0) return `${val / 60} h`;
              return `${val} min`;
            },
          },
          splitLine: buildSplitLineStyle(tokens),
        },
      yAxis: isLog
        ? {
          type: 'log',
          name: 'Intensidade (mm/h)',
          nameLocation: 'end',
          nameGap: 14,
          nameTextStyle: {
            color: tokens.textMuted,
            fontFamily: tokens.fontFamily,
            fontSize: 11,
            fontWeight: 500,
            align: 'left',
            padding: [0, 0, 6, -20],
          },
          axisLine: buildAxisLineStyle(tokens),
          axisLabel: {
            ...buildAxisLabelBase(tokens),
            formatter: (val: number) => val.toLocaleString('pt-BR'),
          },
          splitLine: buildSplitLineStyle(tokens),
        }
        : {
          type: 'value',
          min: 0,
          name: 'Intensidade (mm/h)',
          nameLocation: 'end',
          nameGap: 14,
          nameTextStyle: {
            color: tokens.textMuted,
            fontFamily: tokens.fontFamily,
            fontSize: 11,
            fontWeight: 500,
            align: 'left',
            padding: [0, 0, 6, -20],
          },
          axisLine: buildAxisLineStyle(tokens),
          axisLabel: {
            ...buildAxisLabelBase(tokens),
            formatter: (val: number) => val.toLocaleString('pt-BR'),
          },
          splitLine: buildSplitLineStyle(tokens),
        },
      series: seriesList,
    };
  }
}