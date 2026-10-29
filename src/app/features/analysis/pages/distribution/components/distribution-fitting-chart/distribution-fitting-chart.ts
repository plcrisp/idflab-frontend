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
import { EChartsOption, SeriesOption } from 'echarts';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import {
  DistributionEnum,
  DurationDetailResponse,
} from '../../models/statistical-distribution.model';
import {
  getDistributionColor,
  getDistributionConfig,
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
  readonly loading = input<boolean>(false);

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    detail: DurationDetailResponse;
    selected: DistributionEnum | null;
    suggested: DistributionEnum | null;
  }>;

  private readonly chartData = computed(() => {
    const d = this.detail();
    if (!d || this.loading()) return null;
    return {
      detail: d,
      selected: this.selectedDistribution(),
      suggested: this.suggestedDistribution(),
    };
  });

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer?.nativeElement,
      data: this.chartData,
      buildOption: (data) => this.buildOption(data),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(data: {
    detail: DurationDetailResponse;
    selected: DistributionEnum | null;
    suggested: DistributionEnum | null;
  }): EChartsOption {
    const tokens = this.echarts.getTokens();
    const { detail, selected, suggested } = data;
    const binEdges = detail.bin_edges ?? [];
    const empiricalDensity = detail.empirical_density ?? [];
    const curveX = detail.curve_x ?? [];
    const distributions = detail.distributions ?? [];

    const minX = curveX.length > 0 ? curveX[0] : (binEdges.length > 0 ? binEdges[0] : 0);
    const maxX = curveX.length > 0 ? curveX[curveX.length - 1] : (binEdges.length > 0 ? binEdges[binEdges.length - 1] : 100);

    // Distribuições válidas (status == 'ok')
    const validDists = distributions.filter((d) => d.status === 'ok' && d.pdf_density);

    // Legenda ECharts com seleção padrão: todas as distribuições válidas iniciam visíveis
    const legendData: { name: string; itemStyle: { color: string } }[] = [];
    const legendSelected: Record<string, boolean> = {};

    validDists.forEach((d) => {
      const cfg = getDistributionConfig(d.distribution);
      const color = getDistributionColor(d.distribution);
      legendData.push({
        name: cfg.name,
        itemStyle: { color },
      });
      legendSelected[cfg.name] = true;
    });

    // Custom Series: Barras do Histograma
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

    // Series das Curvas de Ajuste (PDF)
    const curveSeries: SeriesOption[] = validDists.map((d) => {
      const cfg = getDistributionConfig(d.distribution);
      const color = getDistributionColor(d.distribution);
      const isSelected = d.distribution === selected;
      const lineWidth = isSelected ? 3.0 : 1.6;
      const points = (d.pdf_density || []).map((val, idx) => [curveX[idx], val]);

      return {
        name: cfg.name,
        type: 'line',
        smooth: 0.25,
        symbol: 'none',
        data: points,
        lineStyle: {
          color,
          width: lineWidth,
          type: 'solid',
        },
        itemStyle: {
          color,
        },
        z: isSelected ? 5 : 4,
      };
    });

    const tooltipBase = buildTooltipBase(tokens);

    return {
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

          // Localiza o bin correspondente a xVal
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
      yAxis: {
        type: 'value',
        name: 'Densidade',
        nameLocation: 'end',
        nameTextStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 500,
          align: 'left',
          padding: [0, 0, 8, -14],
        },
        axisLine: buildAxisLineStyle(tokens),
        axisTick: { show: false },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          formatter: (val: number) => val.toFixed(3).replace('.', ','),
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [histogramSeries, ...curveSeries],
    };
  }
}

