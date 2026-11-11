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

// Paleta centralizada extraída do design system e das variáveis do IDFLab
const COLORS = {
  primary: '#49628b',
  primaryDark: '#32415a',
  primaryLight: '#7a93b6',
  accent: '#f59e0b', // --accent-500 / --chart-historical-max (máximo observado)
  chartBarFilled: '#d9480f', // --chart-bar-filled (valores preenchidos)
  ana: '#0f766e',
  inmet: '#49628b',
  cemaden: '#0891b2',
  cyanFuture: '#38bdf8',
  gev: '#3b82f6',
  mutedLine: 'rgba(148, 163, 184, 0.5)',
  mutedGrid: 'rgba(148, 163, 184, 0.12)',
  tr: {
    tr2: '#0f766e',
    tr10: '#0284c7',
    tr25: '#7e22ce',
    tr100: '#b91c1c',
  },
} as const;

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
      case 'results':
        return this.buildResultsOption();
    }
  }

  // 1. MAPA: Malha regional com estações das 3 redes (ANA, INMET, CEMADEN) e estação selecionada
  private buildMapOption(): EChartsOption {
    const anaStations = [
      [-47.92, -23.46],
      [-47.42, -23.58],
      [-47.88, -23.75],
    ];
    const inmetStations = [
      [-47.58, -23.32],
      [-47.48, -23.38],
      [-47.98, -23.72],
    ];
    const cemadenStations = [
      [-47.82, -23.78],
      [-47.66, -23.74],
      [-47.36, -23.48],
    ];
    const selectedStation = [[-47.72, -23.52]];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: {
        type: 'value',
        min: -48.1,
        max: -47.25,
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: true, lineStyle: { color: COLORS.mutedGrid, type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        min: -23.88,
        max: -23.22,
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: true, lineStyle: { color: COLORS.mutedGrid, type: 'dashed' } },
      },
      series: [
        {
          name: 'ANA',
          type: 'scatter',
          data: anaStations,
          symbolSize: 6,
          itemStyle: { color: COLORS.ana, opacity: 0.85 },
          z: 2,
        },
        {
          name: 'INMET',
          type: 'scatter',
          data: inmetStations,
          symbolSize: 6,
          itemStyle: { color: COLORS.inmet, opacity: 0.85 },
          z: 2,
        },
        {
          name: 'CEMADEN',
          type: 'scatter',
          data: cemadenStations,
          symbolSize: 6,
          itemStyle: { color: COLORS.cemaden, opacity: 0.85 },
          z: 2,
        },
        {
          name: 'Selecionada',
          type: 'effectScatter',
          data: selectedStation,
          symbolSize: 9,
          rippleEffect: { scale: 3.5, brushType: 'stroke', period: 3 },
          itemStyle: { color: COLORS.primaryDark },
          z: 5,
        },
      ],
    };
  }

  // 2. VISUALIZAÇÃO INICIAL: Série histórica de máximos anuais em barras azuis com linha de máximo histórico
  private buildInitialVisualizationOption(): EChartsOption {
    const values = [
      48, 55, 62, 45, 78, 58, 64, 42, 88, 56,
      70, 65, 118, 60, 74, 52, 82, 66, 75, 54,
    ];
    const maxValue = Math.max(...values); // 118

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: values.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 130, show: false },
      series: [
        {
          name: 'Máximo Anual',
          type: 'bar',
          data: values.map((val) => ({
            value: val,
            itemStyle: {
              color: COLORS.primary,
              borderRadius: [2, 2, 0, 0],
              opacity: 0.85,
            },
          })),
          barWidth: '60%',
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: COLORS.accent, type: 'dashed', width: 1.5, opacity: 0.95 },
            data: [{ yAxis: maxValue }],
          },
        },
      ],
    };
  }

  // 3. VERIFICAÇÃO DE CONSISTÊNCIA: Reta ideal 1:1 tracejada + Curva de Dupla Massa acumulada
  private buildConsistencyOption(): EChartsOption {
    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'value', min: 0, max: 2000, show: false },
      yAxis: { type: 'value', min: 0, max: 2000, show: false },
      series: [
        {
          name: 'Relação Ideal 1:1',
          type: 'line',
          data: [
            [0, 0],
            [2000, 2000],
          ],
          lineStyle: { color: COLORS.mutedLine, type: 'dashed', width: 1.5 },
          symbol: 'none',
          z: 2,
        },
        {
          name: 'Dupla Massa Observada',
          type: 'line',
          data: [
            [0, 0],
            [380, 360],
            [740, 710],
            [1120, 1070],
            [1480, 1430],
            [1820, 1770],
            [2000, 1940],
          ],
          smooth: 0.15,
          lineStyle: { color: COLORS.primary, width: 2.4 },
          showSymbol: true,
          symbolSize: 4.5,
          itemStyle: { color: COLORS.primary },
          z: 4,
        },
      ],
    };
  }

  // 4. TRATAMENTO DE FALHAS: Sinal contínuo com intervalo ausente preenchido (vermelho chartBarFilled)
  private buildGapTreatmentOption(): EChartsOption {
    const observed1 = [16, 28, 45, 26, 14, null, null, null, null, null, null, null, null];
    const imputed = [null, null, null, null, 14, 25, 38, 30, 20, null, null, null, null];
    const observed2 = [null, null, null, null, null, null, null, null, 20, 34, 48, 28, 18];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: observed1.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 55, show: false },
      series: [
        {
          name: 'Observado Inicial',
          type: 'line',
          data: observed1,
          connectNulls: false,
          lineStyle: { color: COLORS.primary, width: 2.2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Observado Final',
          type: 'line',
          data: observed2,
          connectNulls: false,
          lineStyle: { color: COLORS.primary, width: 2.2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Preenchido (Random Forest)',
          type: 'line',
          data: imputed,
          lineStyle: { color: COLORS.chartBarFilled, width: 2, type: 'dashed' },
          areaStyle: { color: 'rgba(217, 72, 15, 0.14)' },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }

  // 5. RESOLUÇÃO TEMPORAL: Curva de desagregação de intensidade com queda acentuada sub-horária
  private buildTemporalResolutionOption(): EChartsOption {
    const intensities = [142, 114, 92, 64, 44, 29, 16, 10, 6];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: intensities.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 155, show: false },
      series: [
        {
          name: 'Intensidade por Duração',
          type: 'line',
          smooth: 0.35,
          data: intensities,
          lineStyle: { color: COLORS.primary, width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(73, 98, 139, 0.35)' },
                { offset: 1, color: 'rgba(73, 98, 139, 0.02)' },
              ],
            },
          },
          showSymbol: true,
          symbolSize: (value: number, params: { dataIndex: number }) => {
            return params.dataIndex % 2 === 0 ? 5 : 0;
          },
          itemStyle: { color: COLORS.primaryDark },
          z: 4,
        },
      ],
    };
  }

  // 6. DISTRIBUIÇÃO ESTATÍSTICA: Histograma empírico em barras sutis com curva teórica GEV ajustada
  private buildStatisticalDistributionOption(): EChartsOption {
    const hist = [12, 28, 52, 66, 48, 28, 16, 8];
    const gev = [10, 29, 54, 67, 46, 26, 14, 6];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: hist.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 74, show: false },
      series: [
        {
          name: 'Frequência Observada',
          type: 'bar',
          data: hist,
          barWidth: '60%',
          itemStyle: {
            color: 'rgba(73, 98, 139, 0.22)',
            borderColor: 'rgba(73, 98, 139, 0.45)',
            borderWidth: 1,
            borderRadius: [2, 2, 0, 0],
          },
          z: 2,
        },
        {
          name: 'Ajuste GEV',
          type: 'line',
          smooth: 0.3,
          data: gev,
          lineStyle: { color: COLORS.gev, width: 2.5 },
          symbol: 'none',
          z: 5,
        },
      ],
    };
  }

  // 7. CURVAS IDF HISTÓRICAS: Família de curvas IDF com as cores oficiais de TR do IDFLab
  private buildHistoricalIdfOption(): EChartsOption {
    const tr100 = [152, 108, 79, 52, 34, 16, 9.5, 5.8];
    const tr25 = [126, 89, 64, 42, 27, 13, 7.8, 4.8];
    const tr10 = [102, 72, 51, 33, 21, 10, 6.0, 3.6];
    const tr2 = [68, 47, 33, 21, 13, 6.5, 3.8, 2.3];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: tr100.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 165, show: false },
      series: [
        {
          name: 'TR 2 anos',
          type: 'line',
          smooth: 0.3,
          data: tr2,
          lineStyle: { color: COLORS.tr.tr2, width: 1.8 },
          symbol: 'none',
          z: 2,
        },
        {
          name: 'TR 10 anos',
          type: 'line',
          smooth: 0.3,
          data: tr10,
          lineStyle: { color: COLORS.tr.tr10, width: 2.0 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'TR 25 anos',
          type: 'line',
          smooth: 0.3,
          data: tr25,
          lineStyle: { color: COLORS.tr.tr25, width: 2.2 },
          symbol: 'none',
          z: 4,
        },
        {
          name: 'TR 100 anos',
          type: 'line',
          smooth: 0.3,
          data: tr100,
          lineStyle: { color: COLORS.tr.tr100, width: 2.4 },
          symbol: 'none',
          z: 5,
        },
      ],
    };
  }

  // 8. CENÁRIOS FUTUROS: Máximos anuais futuros (Bruto vs Corrigido) com linha de referência observada
  private buildFutureScenariosOption(): EChartsOption {
    const raw = [82, 105, 74, 98, 120, 88, 112, 95];
    const corr = [70, 89, 63, 83, 101, 75, 94, 80];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: raw.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 130, show: false },
      series: [
        {
          name: 'Modelo Bruto',
          type: 'bar',
          barWidth: '35%',
          data: raw,
          itemStyle: { color: 'rgba(73, 98, 139, 0.35)', borderRadius: [2, 2, 0, 0] },
          z: 2,
        },
        {
          name: 'Modelo Corrigido',
          type: 'bar',
          barWidth: '35%',
          data: corr,
          itemStyle: { color: COLORS.cyanFuture, borderRadius: [2, 2, 0, 0] },
          z: 3,
        },
        {
          name: 'Média Observada',
          type: 'line',
          data: [74, 74, 74, 74, 74, 74, 74, 74],
          lineStyle: { color: COLORS.accent, width: 1.8, type: 'dashed' },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }

  // 9. RESULTADOS: Curvas IDF comparativas (Histórica sólida vs Futura tracejada)
  private buildResultsOption(): EChartsOption {
    const histTr100 = [152, 108, 79, 52, 34, 16, 9.5, 5.8];
    const futTr100 = [178, 126, 92, 61, 40, 19, 11.2, 6.8];
    const histTr10 = [102, 72, 51, 33, 21, 10, 6.0, 3.6];
    const futTr10 = [119, 84, 60, 39, 25, 11.8, 7.1, 4.3];

    return {
      animationDuration: 300,
      grid: COMMON_GRID,
      tooltip: { show: false },
      xAxis: { type: 'category', data: histTr100.map((_, i) => String(i)), show: false },
      yAxis: { type: 'value', min: 0, max: 190, show: false },
      series: [
        {
          name: 'TR 10 anos Histórico',
          type: 'line',
          smooth: 0.3,
          data: histTr10,
          lineStyle: { color: COLORS.tr.tr10, width: 2.0 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'TR 10 anos Futuro',
          type: 'line',
          smooth: 0.3,
          data: futTr10,
          lineStyle: { color: COLORS.tr.tr10, width: 2.0, type: 'dashed' },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'TR 100 anos Histórico',
          type: 'line',
          smooth: 0.3,
          data: histTr100,
          lineStyle: { color: COLORS.tr.tr100, width: 2.2 },
          symbol: 'none',
          z: 4,
        },
        {
          name: 'TR 100 anos Futuro',
          type: 'line',
          smooth: 0.3,
          data: futTr100,
          lineStyle: { color: COLORS.tr.tr100, width: 2.2, type: 'dashed' },
          areaStyle: {
            color: 'rgba(185, 28, 28, 0.08)',
          },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }
}
