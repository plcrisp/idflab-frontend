import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EChartsOption, SeriesOption } from 'echarts';
import * as echarts from 'echarts';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import {
  DistributionEnum,
  DurationDetailResponse,
} from '../../models/statistical-distribution.model';
import {
  getDistributionColor,
  getDistributionConfig,
  getDistributionByName,
} from '../../constants/statistical-distribution.constants';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildSplitLineStyle,
  buildTooltipBase,
} from '../../../initial-visualization/utils/chart-options.utils';

@Component({
  selector: 'app-distribution-fitting-chart',
  standalone: true,
  imports: [CommonModule, ...HlmSkeletonImports],
  providers: [EchartsService],
  templateUrl: './distribution-fitting-chart.html',
  styleUrl: './distribution-fitting-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionFittingChart implements OnDestroy {
  readonly detail = input<DurationDetailResponse | null>(null);
  readonly selectedDistribution = input<DistributionEnum | null>(null);
  readonly suggestedDistribution = input<DistributionEnum | null>(null);
  readonly hoveredDistribution = input<DistributionEnum | null>(null);
  readonly loading = input<boolean>(false);
  readonly chartMode = model<'pdf' | 'cdf'>('pdf');

  readonly distributionHovered = output<DistributionEnum | null>();

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly internalHoveredDistribution = signal<DistributionEnum | null>(null);

  private readonly echarts = inject(EchartsService) as EchartsService<{
    detail: DurationDetailResponse;
    selected: DistributionEnum | null;
    suggested: DistributionEnum | null;
    hovered: DistributionEnum | null;
    mode: 'pdf' | 'cdf';
  }>;

  private readonly activeHovered = computed(() => {
    return this.hoveredDistribution() ?? this.internalHoveredDistribution();
  });

  private readonly chartData = computed(() => {
    const d = this.detail();
    if (!d || this.loading()) return null;
    return {
      detail: d,
      selected: this.selectedDistribution(),
      suggested: this.suggestedDistribution(),
      hovered: this.activeHovered(),
      mode: this.chartMode(),
    };
  });

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer?.nativeElement,
      data: this.chartData,
      buildOption: (data) => this.buildOption(data),
      onInit: (chart) => this.attachChartEvents(chart),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private attachChartEvents(chart: echarts.ECharts): void {
    chart.on('legendmouseover', (params: any) => {
      const dist = getDistributionByName(params.name);
      if (dist) {
        this.internalHoveredDistribution.set(dist);
        this.distributionHovered.emit(dist);
      }
    });

    chart.on('legendmouseout', () => {
      this.internalHoveredDistribution.set(null);
      this.distributionHovered.emit(null);
    });

    chart.on('mouseover', (params: any) => {
      if (params.seriesType === 'line' && params.seriesName) {
        const dist = getDistributionByName(params.seriesName);
        if (dist) {
          this.internalHoveredDistribution.set(dist);
          this.distributionHovered.emit(dist);
        }
      }
    });

    chart.on('mouseout', (params: any) => {
      if (params.seriesType === 'line') {
        this.internalHoveredDistribution.set(null);
        this.distributionHovered.emit(null);
      }
    });

    chart.getZr()?.on('globalout', () => {
      this.internalHoveredDistribution.set(null);
      this.distributionHovered.emit(null);
    });
  }

  private buildOption(data: {
    detail: DurationDetailResponse;
    selected: DistributionEnum | null;
    suggested: DistributionEnum | null;
    hovered: DistributionEnum | null;
    mode: 'pdf' | 'cdf';
  }): EChartsOption {
    const tokens = this.echarts.getTokens();
    const { detail, selected, hovered, mode } = data;
    const binEdges = detail.bin_edges ?? [];
    const empiricalDensity = detail.empirical_density ?? [];
    const empiricalCdf = detail.empirical_cdf ?? [];
    const annualMaxs = detail.annual_maximums ?? [];
    const curveX = detail.curve_x ?? [];
    const distributions = detail.distributions ?? [];

    const focusedDist = hovered ?? selected;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const animDuration = prefersReducedMotion ? 0 : 200;

    let minX = curveX.length > 0 ? curveX[0] : (binEdges.length > 0 ? binEdges[0] : 0);
    let maxX = curveX.length > 0 ? curveX[curveX.length - 1] : (binEdges.length > 0 ? binEdges[binEdges.length - 1] : 100);

    if (mode === 'cdf' && empiricalCdf.length > 0) {
      minX = Math.min(minX, empiricalCdf[0].x);
      maxX = Math.max(maxX, empiricalCdf[empiricalCdf.length - 1].x);
    }

    // Distribuições válidas conforme o modo selecionado
    const validDists = distributions.filter((d) =>
      d.status === 'ok' && (mode === 'pdf' ? !!d.pdf_density : !!d.cdf_probability)
    );

    // Legenda ECharts com seleção padrão
    const legendData: { name: string; itemStyle?: { color: string } }[] = [];
    const legendSelected: Record<string, boolean> = {};

    if (mode === 'cdf') {
      legendData.push({
        name: 'Frequência Acumulada Empírica',
        itemStyle: { color: tokens.empiricalLine },
      });
      legendSelected['Frequência Acumulada Empírica'] = true;
    }

    distributions.forEach((d) => {
      const cfg = getDistributionConfig(d.distribution);
      const color = getDistributionColor(d.distribution);
      const isOk = d.status === 'ok' && (mode === 'pdf' ? !!d.pdf_density : !!d.cdf_probability);
      legendData.push({
        name: cfg.name,
        itemStyle: { color: isOk ? color : tokens.border },
      });
      legendSelected[cfg.name] = isOk;
    });

    let series: SeriesOption[] = [];

    if (mode === 'pdf') {
      // 1. Custom Series: Barras do Histograma
      const histogramSeries: SeriesOption = {
        name: 'Histograma (Doane)',
        type: 'custom',
        renderItem: (params, api) => {
          const idx = params.dataIndex;
          if (idx >= binEdges.length - 1) return undefined;

          const x0 = binEdges[idx];
          const x1 = binEdges[idx + 1];
          const yVal = empiricalDensity[idx] ?? 0;

          const pt0 = api.coord([x0, yVal]);
          const pt1 = api.coord([x1, 0]);

          const width = Math.max(1, pt1[0] - pt0[0]);
          const height = Math.max(1, pt1[1] - pt0[1]);

          return {
            type: 'rect',
            shape: {
              x: pt0[0],
              y: pt0[1],
              width,
              height,
            },
            style: {
              fill: 'rgba(73, 98, 139, 0.22)',
              stroke: 'rgba(73, 98, 139, 0.65)',
              lineWidth: 1,
            },
          };
        },
        data: empiricalDensity.map((dens, i) => [(binEdges[i] + binEdges[i + 1]) / 2, dens]),
        z: 2,
      };

      // 2. Series das Curvas de Ajuste (PDF)
      const curveSeries: SeriesOption[] = validDists.map((d) => {
        const cfg = getDistributionConfig(d.distribution);
        const color = getDistributionColor(d.distribution);
        const isFocused = d.distribution === focusedDist;
        const lineWidth = isFocused ? 2.8 : 1.2;
        const opacity = isFocused ? 1.0 : 0.35;
        const zIndex = isFocused ? 10 : 4;
        const points = (d.pdf_density || []).map((val, idx) => [curveX[idx], val]);

        return {
          name: cfg.name,
          type: 'line',
          smooth: 0.25,
          symbol: 'none',
          clip: true,
          data: points,
          lineStyle: {
            color,
            width: lineWidth,
            opacity,
            type: 'solid',
          },
          itemStyle: {
            color,
          },
          emphasis: {
            disabled: true,
          },
          z: zIndex,
        };
      });

      series = [histogramSeries, ...curveSeries];
    } else {
      // Modo CDF:
      // 1. Série Empírica (ECDF em degraus)
      const ecdfSeries: SeriesOption = {
        name: 'Frequência Acumulada Empírica',
        type: 'line',
        step: 'end',
        symbol: 'none',
        showSymbol: false,
        data: empiricalCdf.map((p) => [p.x, p.probability]),
        lineStyle: {
          color: tokens.empiricalLine,
          width: 1.2,
          type: 'solid',
        },
        itemStyle: {
          color: tokens.empiricalLine,
        },
        emphasis: {
          disabled: true,
        },
        z: 3,
      };

      // 2. Séries Teóricas (CDF)
      const cdfCurves: SeriesOption[] = validDists.map((d) => {
        const cfg = getDistributionConfig(d.distribution);
        const color = getDistributionColor(d.distribution);
        const isFocused = d.distribution === focusedDist;
        const lineWidth = isFocused ? 2.8 : 1.2;
        const opacity = isFocused ? 1.0 : 0.35;
        const zIndex = isFocused ? 10 : 4;
        const points = (d.cdf_probability || []).map((val, idx) => [curveX[idx], val]);

        return {
          name: cfg.name,
          type: 'line',
          smooth: 0.25,
          symbol: 'none',
          clip: true,
          data: points,
          lineStyle: {
            color,
            width: lineWidth,
            opacity,
            type: 'solid',
          },
          itemStyle: {
            color,
          },
          emphasis: {
            disabled: true,
          },
          z: zIndex,
        };
      });

      // 3. Marcadores Rug Plot no Eixo X
      const rugSeries: SeriesOption = {
        name: 'Máximas Anuais Observadas',
        type: 'scatter',
        symbol: 'rect',
        symbolSize: [1.5, 8],
        data: annualMaxs.map((m) => [m.value, 0]),
        itemStyle: { color: tokens.empiricalLine },
        z: 2,
      };

      series = [ecdfSeries, ...cdfCurves, rugSeries];
    }

    const tooltipBase = buildTooltipBase(tokens);
    const maxEmpirical = empiricalDensity.length > 0 ? Math.max(...empiricalDensity, 0) : 0;
    const maxY = maxEmpirical > 0 ? Number((maxEmpirical * 1.5).toFixed(4)) : undefined;

    const yAxisConfig =
      mode === 'pdf'
        ? {
            type: 'value' as const,
            min: 0,
            max: maxY,
            name: 'Densidade de Probabilidade',
            nameLocation: 'end' as const,
            nameTextStyle: {
              color: tokens.textMuted,
              fontFamily: tokens.fontFamily,
              fontSize: 11,
              fontWeight: 500,
              align: 'left' as const,
              padding: [0, 0, 8, -14],
            },
            axisLine: buildAxisLineStyle(tokens),
            axisTick: { show: false },
            axisLabel: {
              ...buildAxisLabelBase(tokens),
              formatter: (val: number) => val.toFixed(3).replace('.', ','),
            },
            splitLine: buildSplitLineStyle(tokens),
          }
        : {
            type: 'value' as const,
            min: 0,
            max: 1,
            name: 'Probabilidade Acumulada P(X ≤ x)',
            nameLocation: 'end' as const,
            nameTextStyle: {
              color: tokens.textMuted,
              fontFamily: tokens.fontFamily,
              fontSize: 11,
              fontWeight: 500,
              align: 'left' as const,
              padding: [0, 0, 8, -14],
            },
            axisLine: buildAxisLineStyle(tokens),
            axisTick: { show: false },
            axisLabel: {
              ...buildAxisLabelBase(tokens),
              formatter: (val: number) => `${Math.round(val * 100)}%`,
            },
            splitLine: buildSplitLineStyle(tokens),
          };

    return {
      animation: !prefersReducedMotion,
      animationDuration: animDuration,
      animationDurationUpdate: animDuration,
      animationEasingUpdate: 'cubicOut',
      textStyle: { fontFamily: tokens.fontFamily },
      legend: {
        show: true,
        top: 0,
        right: 0,
        itemGap: 14,
        itemWidth: 16,
        itemHeight: 8,
        selectedMode: true,
        selected: legendSelected,
        textStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
        },
        data: legendData,
      },
      grid: {
        left: 20,
        right: 20,
        top: 36,
        bottom: 34,
        containLabel: true,
      },
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: tokens.border, type: 'dashed' },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const firstPoint = params[0];
          const xVal = Array.isArray(firstPoint.value) ? firstPoint.value[0] : Number(firstPoint.name);

          if (mode === 'pdf') {
            let binIndex = -1;
            for (let i = 0; i < binEdges.length - 1; i++) {
              if (xVal >= binEdges[i] && (xVal <= binEdges[i + 1] || i === binEdges.length - 2)) {
                binIndex = i;
                break;
              }
            }

            const binRange =
              binIndex >= 0
                ? `${binEdges[binIndex].toLocaleString('pt-BR', { maximumFractionDigits: 1 })} a ${binEdges[binIndex + 1].toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm/h`
                : '-';

            const empDensity =
              binIndex >= 0 && empiricalDensity[binIndex] != null
                ? empiricalDensity[binIndex].toFixed(4).replace('.', ',')
                : '-';

            let curvesHtml = '';
            params.forEach((p: any) => {
              if (p.seriesName === 'Histograma (Doane)') return;
              const y = Array.isArray(p.value) ? p.value[1] : p.value;
              if (y == null || isNaN(y)) return;

              const yFmt = Number(y).toFixed(4).replace('.', ',');
              curvesHtml += `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;">
                  <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;border-radius:2px;background-color:${p.color};"></span>
                    <span style="color:${tokens.text};font-weight:500;">${p.seriesName}:</span>
                  </span>
                  <strong style="color:${tokens.text};font-variant-numeric:tabular-nums;">${yFmt}</strong>
                </div>
              `;
            });

            return `
              <div style="font-family:${tokens.fontFamily};font-size:12px;line-height:1.5;min-width:210px;">
                <div style="font-weight:600;color:${tokens.text};margin-bottom:6px;border-bottom:1px solid ${tokens.border};padding-bottom:4px;">
                  Intensidade: ${Number(xVal).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm/h
                </div>
                <div style="margin-bottom:4px;display:flex;justify-content:space-between;gap:8px;">
                  <span style="color:${tokens.textMuted};">Faixa do bin:</span>
                  <span style="color:${tokens.text};font-weight:500;">${binRange}</span>
                </div>
                <div style="margin-bottom:6px;display:flex;justify-content:space-between;gap:8px;">
                  <span style="color:${tokens.textMuted};">Densidade empírica:</span>
                  <strong style="color:${tokens.text};font-variant-numeric:tabular-nums;">${empDensity}</strong>
                </div>
                ${curvesHtml ? `<div style="border-top:1px dashed ${tokens.borderSubtle};padding-top:4px;margin-top:4px;">${curvesHtml}</div>` : ''}
              </div>
            `;
          } else {
            // Modo CDF
            let curvesHtml = '';
            params.forEach((p: any) => {
              if (p.seriesName === 'Máximas Anuais Observadas') return;
              const y = Array.isArray(p.value) ? p.value[1] : p.value;
              if (y == null || isNaN(y)) return;

              const yFmt = `${(Number(y) * 100).toFixed(1).replace('.', ',')}%`;
              curvesHtml += `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;">
                  <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;border-radius:2px;background-color:${p.color};"></span>
                    <span style="color:${tokens.text};font-weight:500;">${p.seriesName}:</span>
                  </span>
                  <strong style="color:${tokens.text};font-variant-numeric:tabular-nums;">${yFmt}</strong>
                </div>
              `;
            });

            return `
              <div style="font-family:${tokens.fontFamily};font-size:12px;line-height:1.5;min-width:220px;">
                <div style="font-weight:600;color:${tokens.text};margin-bottom:6px;border-bottom:1px solid ${tokens.border};padding-bottom:4px;">
                  Intensidade: ${Number(xVal).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm/h
                </div>
                <div style="color:${tokens.textMuted};font-size:11px;margin-bottom:4px;">
                  Probabilidade Acumulada P(X ≤ x):
                </div>
                ${curvesHtml ? `<div style="padding-top:2px;">${curvesHtml}</div>` : ''}
              </div>
            `;
          }
        },
      },
      xAxis: {
        type: 'value',
        min: minX,
        max: maxX,
        name: 'Intensidade (mm/h)',
        nameLocation: 'middle',
        nameGap: 24,
        nameTextStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: buildAxisLineStyle(tokens),
        axisTick: { show: true, lineStyle: { color: tokens.border } },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          hideOverlap: true,
          formatter: (val: number) => Math.round(val).toLocaleString('pt-BR'),
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      yAxis: yAxisConfig,
      series,
    };
  }
}
