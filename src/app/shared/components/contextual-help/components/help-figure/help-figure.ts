import {
  AfterViewInit,
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

import { EchartsService, ChartTokens } from '../../../../../core/services/utils/echarts.service';
import { HelpFigureKey } from '../../../../../core/models/contextual-help.model';

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

  readonly badge = computed<{ text: string; variant: 'primary' | 'amber' | 'emerald' | 'muted' }>(() => {
    switch (this.figure()) {
      case 'map':
        return { text: 'ANA · 02346001', variant: 'muted' };
      case 'initial-visualization':
        return { text: 'Pico: 128,4 mm', variant: 'amber' };
      case 'consistency-check':
        return { text: '1:1 vs Dupla Massa', variant: 'muted' };
      case 'gap-treatment':
        return { text: 'Random Forest', variant: 'amber' };
      case 'temporal-resolution':
        return { text: '10 min · 92,3 mm/h', variant: 'muted' };
      case 'statistical-distribution':
        return { text: 'GEV · Menor SSE', variant: 'emerald' };
      case 'historical-idf':
        return { text: 'TR 2 a 100 anos', variant: 'primary' };
      case 'future-scenarios':
        return { text: 'SSP5-8.5 (+18%)', variant: 'amber' };
    }
  });

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
    const tokens = this.echarts.getTokens();

    switch (fig) {
      case 'map':
        return this.buildMapOption(tokens);
      case 'initial-visualization':
        return this.buildInitialVisualizationOption(tokens);
      case 'consistency-check':
        return this.buildConsistencyOption(tokens);
      case 'gap-treatment':
        return this.buildGapTreatmentOption(tokens);
      case 'temporal-resolution':
        return this.buildTemporalResolutionOption(tokens);
      case 'statistical-distribution':
        return this.buildStatisticalDistributionOption(tokens);
      case 'historical-idf':
        return this.buildHistoricalIdfOption(tokens);
      case 'future-scenarios':
        return this.buildFutureScenariosOption(tokens);
    }
  }

  private getBaseTooltip(tokens: ChartTokens) {
    return {
      trigger: 'axis' as const,
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      padding: [6, 10] as [number, number],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.18); border-radius: 6px; z-index: 50;',
      textStyle: {
        color: tokens.text,
        fontFamily: tokens.fontFamily,
        fontSize: 11,
      },
      axisPointer: {
        type: 'line' as const,
        lineStyle: { color: tokens.border, type: 'dashed' as const },
      },
    };
  }

  // 1. MAPA: Dispersão Cartográfica de Estações e Estação Central com Ripple Effect
  private buildMapOption(tokens: ChartTokens): EChartsOption {
    const neighbors = [
      [-47.92, -23.46, 'Estação Sorocaba (DAEE)'],
      [-47.58, -23.32, 'Estação Itu (INMET)'],
      [-47.98, -23.72, 'Estação Piedade (ANA)'],
      [-47.42, -23.58, 'Estação Salto (ANA)'],
      [-47.82, -23.78, 'Estação Votorantim (CEMADEN)'],
      [-47.48, -23.38, 'Estação Porto Feliz (DAEE)'],
      [-47.66, -23.74, 'Estação Ibiúna (ANA)'],
    ];

    const primary = [[-47.72, -23.52, 'ANA · 02346001 (Operante)']];

    return {
      animationDuration: 400,
      grid: { left: 16, right: 16, top: 16, bottom: 16, containLabel: false },
      tooltip: {
        trigger: 'item',
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        borderWidth: 1,
        padding: [6, 10],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.18); border-radius: 6px;',
        textStyle: { color: tokens.text, fontFamily: tokens.fontFamily, fontSize: 11 },
        formatter: (p: any) => {
          const val = p.value;
          return `
            <div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">${val[2]}</div>
            <div style="color:${tokens.textMuted};font-size:10px;">Lat: ${val[1].toFixed(2)}° · Lon: ${val[0].toFixed(2)}°</div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        min: -48.1,
        max: -47.3,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: -23.85,
        max: -23.25,
        show: false,
      },
      series: [
        {
          name: 'Estações Vizinhas',
          type: 'scatter',
          data: neighbors,
          symbolSize: 7,
          itemStyle: {
            color: 'rgba(73, 98, 139, 0.55)',
            borderColor: tokens.surface,
            borderWidth: 1,
          },
          z: 2,
        },
        {
          name: 'Estação Selecionada',
          type: 'effectScatter',
          data: primary,
          symbolSize: 10,
          rippleEffect: {
            scale: 3.5,
            brushType: 'stroke',
            period: 3,
          },
          itemStyle: {
            color: '#f59e0b',
            shadowBlur: 8,
            shadowColor: 'rgba(245, 158, 11, 0.5)',
          },
          z: 5,
        },
      ],
    };
  }

  // 2. VISUALIZAÇÃO INICIAL: Histograma de Máximos Anuais com Destaque no Recorde Histórico
  private buildInitialVisualizationOption(tokens: ChartTokens): EChartsOption {
    const years = ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
    const values = [54.2, 68.0, 42.5, 78.9, 128.4, 62.1, 51.0, 74.3, 89.2, 58.7, 71.5];

    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const isPeak = p.name === '18';
          return `
            <div style="font-weight:600;color:${tokens.text};">Ano 20${p.name}</div>
            <div style="margin-top:2px;display:flex;align-items:center;gap:6px;">
              <span style="color:${isPeak ? '#f59e0b' : tokens.primary};font-weight:600;">${p.value} mm</span>
              ${isPeak ? '<span style="font-size:9px;color:#f59e0b;font-weight:bold;">★ Recorde</span>' : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 140,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Máximo Anual',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: idx === 4 ? '#f59e0b' : 'rgba(73, 98, 139, 0.7)',
              borderRadius: [2, 2, 0, 0],
            },
          })),
          barWidth: 10,
        },
      ],
    };
  }

  // 3. VERIFICAÇÃO DE CONSISTÊNCIA: Dupla Massa com Linha de Referência 1:1 e Ponto Focal
  private buildConsistencyOption(tokens: ChartTokens): EChartsOption {
    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const val = p.value;
          return `
            <div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">Dupla Massa</div>
            <div style="color:${tokens.textMuted};font-size:10px;">Vizinhos: <strong style="color:${tokens.text};">${val[0]} mm</strong></div>
            <div style="color:${tokens.textMuted};font-size:10px;">Principal: <strong style="color:${tokens.text};">${val[1]} mm</strong></div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 2000,
        splitNumber: 3,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 2000,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Referência 1:1',
          type: 'line',
          data: [[0, 0], [2000, 2000]],
          lineStyle: { type: 'dashed', color: tokens.textMuted, width: 1.2, opacity: 0.4 },
          symbol: 'none',
          z: 2,
        },
        {
          name: 'Curva Dupla Massa',
          type: 'line',
          data: [[0, 0], [350, 360], [700, 720], [1100, 1080], [1420, 1390], [1750, 1680], [2000, 1910]],
          smooth: 0.25,
          lineStyle: { color: tokens.primary, width: 2.2 },
          symbol: 'circle',
          symbolSize: 3,
          itemStyle: { color: tokens.primary },
          z: 4,
        },
        {
          name: 'Ponto Inspecionado',
          type: 'scatter',
          data: [[1420, 1390]],
          symbolSize: 8,
          itemStyle: { color: '#f59e0b', borderColor: tokens.surface, borderWidth: 1.5 },
          z: 6,
        },
      ],
    };
  }

  // 4. TRATAMENTO DE FALHAS: Sinal com Intervalo Preenchido por Random Forest
  private buildGapTreatmentOption(tokens: ChartTokens): EChartsOption {
    const days = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23', '25'];
    const observed = [12, 28, 45, 18, 6, null, null, null, null, 15, 34, 52, 22];
    const imputed = [null, null, null, null, 6, 22, 38, 41, 15, null, null, null, null];

    return {
      animationDuration: 400,
      grid: { left: 30, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const day = params[0]?.name;
          const obs = params.find((p) => p.seriesName === 'Observado')?.value;
          const imp = params.find((p) => p.seriesName === 'Imputado (RF)')?.value;
          return `
            <div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">Dia ${day}</div>
            ${obs != null ? `<div style="color:${tokens.primary};">Observado: <strong>${obs} mm</strong></div>` : ''}
            ${imp != null ? `<div style="color:#f59e0b;">Imputado (RF): <strong>${imp} mm</strong></div>` : ''}
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 60,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Observado',
          type: 'line',
          data: observed,
          connectNulls: false,
          lineStyle: { color: tokens.primary, width: 2.2 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Imputado (RF)',
          type: 'line',
          data: imputed,
          lineStyle: { color: '#f59e0b', width: 2.2, type: 'dashed' },
          areaStyle: { color: 'rgba(245, 158, 11, 0.15)' },
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: { color: '#f59e0b' },
          z: 4,
        },
      ],
    };
  }

  // 5. RESOLUÇÃO TEMPORAL: Curva Hiperbólica de Intensidade por Duração
  private buildTemporalResolutionOption(tokens: ChartTokens): EChartsOption {
    const durations = ['5m', '10m', '15m', '30m', '1h', '2h', '6h', '12h', '24h'];
    const intensities = [118.5, 92.3, 76.8, 52.4, 33.1, 21.6, 9.8, 5.7, 3.2];

    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `
            <div style="font-weight:600;color:${tokens.text};">Duração: ${p.name}</div>
            <div style="color:${tokens.primary};margin-top:2px;">
              Intensidade: <strong>${p.value} mm/h</strong>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: durations,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 130,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Decaimento de Intensidade',
          type: 'line',
          smooth: 0.35,
          data: intensities,
          lineStyle: { color: tokens.primary, width: 2.2 },
          areaStyle: { color: 'rgba(73, 98, 139, 0.12)' },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Curta Duração Focal',
          type: 'scatter',
          data: [['10m', 92.3]],
          symbolSize: 8,
          itemStyle: { color: '#f59e0b', borderColor: tokens.surface, borderWidth: 1.5 },
          z: 5,
        },
      ],
    };
  }

  // 6. DISTRIBUIÇÃO ESTATÍSTICA: Histograma Doane com Curvas GEV e Gumbel
  private buildStatisticalDistributionOption(tokens: ChartTokens): EChartsOption {
    const bins = ['20', '30', '40', '50', '60', '70', '80'];
    const hist = [0.012, 0.038, 0.054, 0.042, 0.024, 0.011, 0.005];
    const gev = [0.010, 0.040, 0.055, 0.041, 0.022, 0.010, 0.004];
    const gumbel = [0.014, 0.035, 0.051, 0.044, 0.026, 0.013, 0.006];

    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          return `
            <div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">Faixa: ${params[0]?.name} mm/h</div>
            <div style="color:#10b981;font-size:10px;">GEV (Melhor ajuste): <strong>${params.find((p) => p.seriesName === 'GEV')?.value}</strong></div>
            <div style="color:#3b82f6;font-size:10px;">Gumbel: <strong>${params.find((p) => p.seriesName === 'Gumbel')?.value}</strong></div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: bins,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 0.065,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: tokens.textMuted,
          fontSize: 8,
          fontFamily: tokens.fontFamily,
          formatter: (v: number) => v.toFixed(2),
        },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Histograma',
          type: 'bar',
          data: hist,
          barWidth: '60%',
          itemStyle: {
            color: 'rgba(73, 98, 139, 0.22)',
            borderColor: 'rgba(73, 98, 139, 0.55)',
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
          lineStyle: { color: '#10b981', width: 2.5 },
          symbol: 'none',
          z: 5,
        },
        {
          name: 'Gumbel',
          type: 'line',
          smooth: 0.3,
          data: gumbel,
          lineStyle: { color: '#3b82f6', width: 1.2, opacity: 0.45 },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }

  // 7. CURVAS IDF HISTÓRICAS: Família de Curvas por Tempo de Retorno (TR)
  private buildHistoricalIdfOption(tokens: ChartTokens): EChartsOption {
    const durations = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '24h'];

    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let rows = `<div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">Duração ${params[0]?.name}</div>`;
          params.forEach((p) => {
            rows += `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;">
                <span style="color:${p.color};font-weight:500;">${p.seriesName}:</span>
                <strong style="color:${tokens.text};">${p.value} mm/h</strong>
              </div>
            `;
          });
          return rows;
        },
      },
      xAxis: {
        type: 'category',
        data: durations,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 165,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'TR 100a',
          type: 'line',
          smooth: 0.3,
          data: [152, 108, 79, 52, 34, 16, 9.5, 5.8],
          lineStyle: { color: '#f87171', width: 2.2 },
          symbol: 'none',
          z: 5,
        },
        {
          name: 'TR 25a',
          type: 'line',
          smooth: 0.3,
          data: [128, 91, 66, 43, 28, 13.5, 8.0, 4.8],
          lineStyle: { color: '#f472b6', width: 1.6 },
          symbol: 'none',
          z: 4,
        },
        {
          name: 'TR 10a',
          type: 'line',
          smooth: 0.3,
          data: [106, 75, 55, 36, 23, 11.2, 6.6, 4.0],
          lineStyle: { color: '#c084fc', width: 1.4 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'TR 2a',
          type: 'line',
          smooth: 0.3,
          data: [72, 51, 37, 24, 15, 7.5, 4.4, 2.7],
          lineStyle: { color: '#14b8a6', width: 1.2 },
          symbol: 'none',
          z: 2,
        },
      ],
    };
  }

  // 8. CENÁRIOS FUTUROS: Histórica vs Projeção SSP5-8.5 (+18%)
  private buildFutureScenariosOption(tokens: ChartTokens): EChartsOption {
    const durations = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '24h'];
    const hist = [106, 75, 55, 36, 23, 11.2, 6.6, 4.0];
    const proj = [125, 88.5, 64.9, 42.5, 27.1, 13.2, 7.8, 4.7];

    return {
      animationDuration: 400,
      grid: { left: 34, right: 14, top: 24, bottom: 20 },
      tooltip: {
        ...this.getBaseTooltip(tokens),
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const hVal = params.find((p) => p.seriesName === 'Histórico Base')?.value;
          const pVal = params.find((p) => p.seriesName === 'Projeção SSP5-8.5')?.value;
          return `
            <div style="font-weight:600;color:${tokens.text};margin-bottom:2px;">Duração ${params[0]?.name}</div>
            <div style="color:${tokens.primary};font-size:10px;">Histórico: <strong>${hVal} mm/h</strong></div>
            <div style="color:#f59e0b;font-size:10px;">Projetado (+18%): <strong>${pVal} mm/h</strong></div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: durations,
        axisLine: { lineStyle: { color: tokens.border } },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 140,
        splitNumber: 3,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tokens.textMuted, fontSize: 9, fontFamily: tokens.fontFamily },
        splitLine: { lineStyle: { color: tokens.border, type: 'dashed', opacity: 0.4 } },
      },
      series: [
        {
          name: 'Histórico Base',
          type: 'line',
          smooth: 0.3,
          data: hist,
          lineStyle: { color: tokens.primary, width: 2.0 },
          symbol: 'none',
          z: 3,
        },
        {
          name: 'Projeção SSP5-8.5',
          type: 'line',
          smooth: 0.3,
          data: proj,
          lineStyle: { color: '#f59e0b', width: 2.2, type: 'dashed' },
          symbol: 'none',
          z: 4,
        },
      ],
    };
  }
}
