import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EChartsOption } from 'echarts';

import { EchartsService } from '../../../../../core/services/utils/echarts.service';
import { HelpFigureKey } from '../../../../../core/models/contextual-help.model';

const HIGHLIGHT = '#f59e0b';
const NEUTRAL = 'rgba(148, 163, 184, 0.45)';
const NEUTRAL_FILL = 'rgba(148, 163, 184, 0.15)';
const COMMON_GRID = { left: 16, right: 16, top: 12, bottom: 12, containLabel: false };

@Component({
  selector: 'app-help-figure',
  standalone: true,
  imports: [CommonModule],
  providers: [EchartsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
  templateUrl: './help-figure.html',
})
export class HelpFigure implements AfterViewInit, OnDestroy {
  readonly figure = input.required<HelpFigureKey>();
  readonly label = input<string>('');

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<HelpFigureKey>;

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer?.nativeElement,
      data: this.figure,
      buildOption: (fig) => this.buildOption(fig),
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.echarts.resize(), 150);
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(fig: HelpFigureKey): EChartsOption {
    switch (fig) {
      case 'map':
        return this.buildMapOption();
      case 'initial-visualization':
        return this.buildInitialVisualizationOption();
      case 'consistency-check':
        return this.buildConsistencyOption();
      case 'gap-treatment':
        return this.buildGapTreatmentOption();
      case 'temporal-resolution':
        return this.buildTemporalResolutionOption();
      case 'statistical-distribution':
        return this.buildStatisticalDistributionOption();
      case 'historical-idf':
        return this.buildHistoricalIdfOption();
      case 'future-scenarios':
        return this.buildFutureScenariosOption();
    }
  }

  // 1. MAPA: Dispersão de estações neutras com 1 estação protagonista em destaque
  private buildMapOption(): EChartsOption {
    const neighbors = [
      [-47.92, -23.46],
      [-47.58, -23.32],
      [-47.98, -23.72],
      [-47.42, -23.58],
      [-47.82, -23.78],
      [-47.48, -23.38],
      [-47.66, -23.74],
    ];
    const primary = [[-47.72, -23.52]];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'value', min: -48.1, max: -47.3, show: false },
      yAxis: { type: 'value', min: -23.85, max: -23.25, show: false },
      series: [
        {
          name: 'Vizinhos',
          type: 'scatter',
          data: neighbors,
          symbolSize: 6,
          itemStyle: { color: NEUTRAL },
          z: 2,
        },
        {
          name: 'Principal',
          type: 'effectScatter',
          data: primary,
          symbolSize: 10,
          rippleEffect: { scale: 3, brushType: 'stroke', period: 3 },
          itemStyle: { color: HIGHLIGHT },
          z: 5,
        },
      ],
    };
  }

  // 2. VISUALIZAÇÃO INICIAL: Histograma de barras neutras com 1 pico protagonista
  private buildInitialVisualizationOption(): EChartsOption {
    const values = [54, 68, 42, 78, 128, 62, 51, 74, 89, 58, 71];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: values.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 135, show: false },
      series: [
        {
          name: 'Máximo Anual',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: idx === 4 ? HIGHLIGHT : NEUTRAL,
              borderRadius: [2, 2, 0, 0],
            },
          })),
          barWidth: 10,
        },
      ],
    };
  }

  // 3. VERIFICAÇÃO DE CONSISTÊNCIA: Curva base neutra com ponto focal protagonista
  private buildConsistencyOption(): EChartsOption {
    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'value', min: 0, max: 2000, show: false },
      yAxis: { type: 'value', min: 0, max: 2000, show: false },
      series: [
        {
          name: 'Curva Dupla Massa',
          type: 'line',
          data: [[0, 0], [350, 360], [700, 720], [1100, 1080], [1420, 1390], [1750, 1680], [2000, 1910]],
          smooth: 0.25,
          lineStyle: { color: NEUTRAL, width: 2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Ponto Focal',
          type: 'scatter',
          data: [[1420, 1390]],
          symbolSize: 8,
          itemStyle: { color: HIGHLIGHT },
          z: 5,
        },
      ],
    };
  }

  // 4. TRATAMENTO DE FALHAS: Sinal neutro com intervalo imputado protagonista
  private buildGapTreatmentOption(): EChartsOption {
    const observed = [14, 28, 44, 20, 8, null, null, null, null, 16, 32, 48, 24];
    const imputed = [null, null, null, null, 8, 22, 38, 40, 16, null, null, null, null];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: observed.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 55, show: false },
      series: [
        {
          name: 'Observado',
          type: 'line',
          data: observed,
          connectNulls: false,
          lineStyle: { color: NEUTRAL, width: 2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Imputado',
          type: 'line',
          data: imputed,
          lineStyle: { color: HIGHLIGHT, width: 2, type: 'dashed' },
          areaStyle: { color: 'rgba(245, 158, 11, 0.15)' },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }

  // 5. RESOLUÇÃO TEMPORAL: Curva neutra de decaimento com pulso de pico protagonista
  private buildTemporalResolutionOption(): EChartsOption {
    const intensities = [118, 92, 76, 52, 33, 21, 10, 6, 3];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: intensities.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 130, show: false },
      series: [
        {
          name: 'Decaimento',
          type: 'line',
          smooth: 0.35,
          data: intensities,
          lineStyle: { color: NEUTRAL, width: 2 },
          areaStyle: { color: NEUTRAL_FILL },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Pulso de Curta Duração',
          type: 'scatter',
          data: [[1, 92]],
          symbolSize: 8,
          itemStyle: { color: HIGHLIGHT },
          z: 5,
        },
      ],
    };
  }

  // 6. DISTRIBUIÇÃO ESTATÍSTICA: Barras empíricas neutras com curva GEV protagonista
  private buildStatisticalDistributionOption(): EChartsOption {
    const hist = [0.012, 0.038, 0.054, 0.042, 0.024, 0.011, 0.005];
    const gev = [0.010, 0.040, 0.055, 0.041, 0.022, 0.010, 0.004];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: hist.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 0.065, show: false },
      series: [
        {
          name: 'Histograma',
          type: 'bar',
          data: hist,
          barWidth: '55%',
          itemStyle: {
            color: NEUTRAL_FILL,
            borderColor: NEUTRAL,
            borderWidth: 1,
            borderRadius: [2, 2, 0, 0],
          },
          z: 2,
        },
        {
          name: 'GEV',
          type: 'line',
          smooth: 0.3,
          data: gev,
          lineStyle: { color: HIGHLIGHT, width: 2.5 },
          symbol: 'none',
          z: 5,
        },
      ],
    };
  }

  // 7. CURVAS IDF HISTÓRICAS: Família de curvas neutras com curva TR 100a protagonista
  private buildHistoricalIdfOption(): EChartsOption {
    const tr100 = [152, 108, 79, 52, 34, 16, 9.5, 5.8];
    const tr25 = [128, 91, 66, 43, 28, 13.5, 8.0, 4.8];
    const tr10 = [106, 75, 55, 36, 23, 11.2, 6.6, 4.0];
    const tr2 = [72, 51, 37, 24, 15, 7.5, 4.4, 2.7];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: tr100.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 165, show: false },
      series: [
        {
          name: 'TR 2a',
          type: 'line',
          smooth: 0.3,
          data: tr2,
          lineStyle: { color: NEUTRAL, width: 1.2 },
          symbol: 'none',
          z: 2,
        },
        {
          name: 'TR 10a',
          type: 'line',
          smooth: 0.3,
          data: tr10,
          lineStyle: { color: NEUTRAL, width: 1.4 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'TR 25a',
          type: 'line',
          smooth: 0.3,
          data: tr25,
          lineStyle: { color: NEUTRAL, width: 1.6 },
          symbol: 'none',
          z: 4,
        },
        {
          name: 'TR 100a',
          type: 'line',
          smooth: 0.3,
          data: tr100,
          lineStyle: { color: HIGHLIGHT, width: 2.2 },
          symbol: 'none',
          z: 5,
        },
      ],
    };
  }

  // 8. CENÁRIOS FUTUROS: Linha base neutra com projeção futura protagonista
  private buildFutureScenariosOption(): EChartsOption {
    const hist = [106, 75, 55, 36, 23, 11.2, 6.6, 4.0];
    const proj = [125, 88.5, 64.9, 42.5, 27.1, 13.2, 7.8, 4.7];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: hist.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 140, show: false },
      series: [
        {
          name: 'Histórico Base',
          type: 'line',
          smooth: 0.3,
          data: hist,
          lineStyle: { color: NEUTRAL, width: 2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Projeção SSP5-8.5',
          type: 'line',
          smooth: 0.3,
          data: proj,
          lineStyle: { color: HIGHLIGHT, width: 2.2, type: 'dashed' },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }
}
