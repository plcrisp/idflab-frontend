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
import { DenseGrid, HistoricalIdfResponse } from '../../models/historical-idf.model';
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
  readonly futureDenseGrid = input<DenseGrid | null>(null);
  readonly scale = input<'log' | 'linear'>('linear');
  readonly loading = input<boolean>(false);
  readonly selectedTrs = input<number[] | null>(null);
  readonly containerHeightClass = input<string>('h-96 sm:h-105');
  readonly showSolidDashedHeader = input<boolean>(true);

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    data: HistoricalIdfResponse;
    futureDenseGrid: DenseGrid | null;
    scale: 'log' | 'linear';
    selectedTrs: number[] | null;
  }>;

  private readonly chartData = computed(() => {
    const d = this.data();
    if (!d || this.loading()) return null;
    return {
      data: d,
      futureDenseGrid: this.futureDenseGrid(),
      scale: this.scale(),
      selectedTrs: this.selectedTrs(),
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

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(payload: {
    data: HistoricalIdfResponse;
    futureDenseGrid: DenseGrid | null;
    scale: 'log' | 'linear';
    selectedTrs: number[] | null;
  }): EChartsOption {
    const tokens = this.echarts.getTokens();
    const { data, futureDenseGrid, scale, selectedTrs } = payload;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const isLog = scale === 'log';
    const hasFuture = !!futureDenseGrid;

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

    const activeReturnPeriods = selectedTrs?.length
      ? data.return_periods.filter((tr) => selectedTrs.includes(tr))
      : data.return_periods;

    for (const tr of activeReturnPeriods) {
      const seriesName = `TR ${tr} anos`;
      const color = getHistoricalIdfTrColor(tr, isLight);

      legendData.push({
        name: seriesName,
        icon: 'roundRect',
        itemStyle: { color },
      });

      const denseDurations = data.dense_grid?.durations_minutes ?? [];
      const denseIntensities = data.dense_grid?.intensities_mm_h?.[String(tr)] ?? [];
      const lineData: [number, number][] = denseDurations.map((d, i) => [
        d,
        denseIntensities[i] ?? 0,
      ]);

      seriesList.push({
        id: `hist-${tr}`,
        name: seriesName,
        type: 'line',
        data: lineData,
        symbol: 'none',
        smooth: false,
        triggerLineEvent: true,
        lineStyle: {
          width: 2.5,
          color,
          type: 'solid',
        },
        emphasis: {
          lineStyle: {
            width: 3.5,
          },
        },
        cursor: 'pointer',
        z: 2,
      });

      if (hasFuture && futureDenseGrid) {
        const futDurations = futureDenseGrid.durations_minutes ?? [];
        const futIntensities = futureDenseGrid.intensities_mm_h?.[String(tr)] ?? [];
        const futLineData: [number, number][] = futDurations.map((d, i) => [
          d,
          futIntensities[i] ?? 0,
        ]);

        seriesList.push({
          id: `fut-${tr}`,
          name: seriesName,
          type: 'line',
          data: futLineData,
          symbol: 'none',
          smooth: false,
          triggerLineEvent: true,
          lineStyle: {
            width: 2.5,
            color,
            type: 'dashed',
          },
          emphasis: {
            lineStyle: {
              width: 3.5,
            },
          },
          cursor: 'pointer',
          z: 3,
        });
      }

      if (isLog && !hasFuture) {
        const quantiles = data.quantiles_mm_h?.[String(tr)] ?? [];
        const scatterData: [number, number][] = durations.map((d, idx) => [
          d.duration_minutes,
          quantiles[idx] ?? 0,
        ]);

        seriesList.push({
          name: seriesName,
          type: 'scatter',
          tooltip: { show: false },
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

    if (isLog && !hasFuture) {
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
        tooltip: { show: false },
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

    const showLegend = !selectedTrs?.length;

    return {
      grid: {
        left: 36,
        right: 20,
        top: showLegend ? 50 : 38,
        bottom: 36,
        containLabel: true,
      },
      legend: {
        show: showLegend,
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
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: tokens.border, type: 'dashed' },
        },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const validParams = (params as Array<{
            seriesId?: string;
            seriesName?: string;
            seriesType?: string;
            color?: string;
            value?: [number, number] | number;
          }>).filter(
            (p) =>
              p &&
              p.seriesName &&
              p.seriesName !== 'Quantil da distribuição' &&
              p.seriesType === 'line',
          );
          if (validParams.length === 0) return '';

          const rawX = Array.isArray(validParams[0].value)
            ? validParams[0].value[0]
            : validParams[0].value;
          const durNum = Number(rawX);
          if (Number.isNaN(durNum)) return '';

          const exactDur = durations.find(
            (d) => Math.abs(d.duration_minutes - durNum) < 0.01,
          );
          let durLabel: string;
          if (exactDur) {
            durLabel = exactDur.label;
          } else if (durationMap[durNum]) {
            durLabel = durationMap[durNum];
          } else if (durNum >= 60 && Math.abs(durNum % 60) < 0.01) {
            durLabel = `${Math.round(durNum / 60)} h`;
          } else if (durNum >= 10) {
            durLabel = `${Math.round(durNum)} min`;
          } else {
            durLabel = `${durNum.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`;
          }

          if (hasFuture) {
            const byTr = new Map<
              number,
              { color: string; hist?: number; fut?: number }
            >();

            for (const p of validParams) {
              const tr = Number(p.seriesName?.match(/\d+/)?.[0] ?? 0);
              if (!tr) continue;
              const yVal = Array.isArray(p.value) ? p.value[1] : p.value;
              if (yVal == null || Number.isNaN(Number(yVal))) continue;

              const entry = byTr.get(tr) ?? { color: p.color ?? tokens.primary };
              if (p.seriesId?.startsWith('fut-')) {
                entry.fut = Number(yVal);
              } else {
                entry.hist = Number(yVal);
              }
              byTr.set(tr, entry);
            }

            const sortedTrs = Array.from(byTr.keys()).sort((a, b) => b - a);
            let rowsHtml = '';
            for (const tr of sortedTrs) {
              const item = byTr.get(tr)!;
              const histFmt =
                item.hist != null
                  ? item.hist.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : '—';
              const futFmt =
                item.fut != null
                  ? item.fut.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : '—';

              rowsHtml += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 3px;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <span style="width: 8px; height: 8px; border-radius: 2px; background-color: ${item.color};"></span>
                    <span style="color: ${tokens.text}; font-weight: 500;">TR ${tr} anos:</span>
                  </span>
                  <span style="color: ${tokens.text}; font-variant-numeric: tabular-nums;">
                    Hist. <strong>${histFmt}</strong> · Fut. <strong>${futFmt}</strong> mm/h
                  </span>
                </div>
              `;
            }

            return `
              <div style="font-family: ${tokens.fontFamily}; min-width: 240px; padding: 2px; box-sizing: border-box; user-select: none;">
                <div style="font-weight: 600; color: ${tokens.text}; font-size: 12px; border-bottom: 1px solid ${tokens.border}; padding-bottom: 5px; margin-bottom: 4px;">
                  Duração: ${durLabel}
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; font-size: 11px;">
                  ${rowsHtml}
                </div>
              </div>
            `;
          }

          validParams.sort((a, b) => {
            const trA = Number(a.seriesName?.match(/\d+/)?.[0] ?? 0);
            const trB = Number(b.seriesName?.match(/\d+/)?.[0] ?? 0);
            return trB - trA;
          });

          let rowsHtml = '';
          for (const p of validParams) {
            const yVal = Array.isArray(p.value) ? p.value[1] : p.value;
            if (yVal == null || Number.isNaN(Number(yVal))) continue;

            const valFmt = Number(yVal).toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });

            rowsHtml += `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 3px;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 2px; background-color: ${p.color}; shrink-0;"></span>
                  <span style="color: ${tokens.text}; font-weight: 500;">${p.seriesName}:</span>
                </span>
                <strong style="color: ${tokens.text}; font-variant-numeric: tabular-nums;">${valFmt} mm/h</strong>
              </div>
            `;
          }

          return `
            <div style="font-family: ${tokens.fontFamily}; min-width: 175px; padding: 2px; box-sizing: border-box; user-select: none;">
              <div style="font-weight: 600; color: ${tokens.text}; font-size: 12px; border-bottom: 1px solid ${tokens.border}; padding-bottom: 5px; margin-bottom: 4px;">
                Duração: ${durLabel}
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px; font-size: 11px;">
                ${rowsHtml}
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
            nameGap: 16,
            nameTextStyle: {
              color: tokens.textMuted,
              fontFamily: tokens.fontFamily,
              fontSize: 11,
              fontWeight: 500,
              align: 'left',
              padding: [0, 0, 8, 0],
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
            nameGap: 16,
            nameTextStyle: {
              color: tokens.textMuted,
              fontFamily: tokens.fontFamily,
              fontSize: 11,
              fontWeight: 500,
              align: 'left',
              padding: [0, 0, 8, 0],
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
