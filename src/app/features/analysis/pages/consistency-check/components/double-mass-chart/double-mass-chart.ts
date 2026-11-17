import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { EChartsOption } from 'echarts';
import { DoubleMassPoint } from '../../models/consistency-check.model';
import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildSplitLineStyle,
  buildTooltipBase,
} from '../../../initial-visualization/utils/chart-options.utils';

function formatAxisCompact(val: number): string {
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    const formatted = (val / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return `${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (val / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return `${formatted}k`;
  }
  return val.toLocaleString('pt-BR');
}

@Component({
  selector: 'app-double-mass-chart',
  standalone: false,
  templateUrl: './double-mass-chart.html',
  styleUrl: './double-mass-chart.scss',
  providers: [EchartsService],
  host: { class: 'block w-full h-full min-w-0' },
})
export class DoubleMassChart implements OnDestroy {
  points = input<DoubleMassPoint[]>([]);
  principalStationName = input<string>('Principal');
  neighborStationName = input<string>('Vizinha');
  loading = input<boolean>(false);

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef<HTMLDivElement>;

  private readonly echarts = inject(EchartsService) as EchartsService<{
    points: DoubleMassPoint[];
    principalName: string;
    neighborName: string;
  }>;

  private readonly chartData = computed(() => {
    if (this.loading()) return null;
    return {
      points: this.points(),
      principalName: this.principalStationName(),
      neighborName: this.neighborStationName(),
    };
  });

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer.nativeElement,
      data: this.chartData,
      buildOption: ({ points, principalName, neighborName }) =>
        this.buildOption(points, principalName, neighborName),
    });
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  private buildOption(
    points: DoubleMassPoint[],
    principalName: string,
    neighborName: string,
  ): EChartsOption {
    const tokens = this.echarts.getTokens();

    if (!points || points.length === 0) {
      return {
        grid: { left: 20, right: 20, top: 32, bottom: 32, containLabel: true },
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: [],
      };
    }

    let maxX = 0;
    let maxY = 0;
    const curvePoints: [number, number][] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      curvePoints.push([p.x, p.y]);
    }

    // Calcula range para linha de referência ideal (1:1)
    const maxCoord = Math.max(maxX, maxY, 100);
    const diagonalLine: [number, number][] = [
      [0, 0],
      [maxCoord, maxCoord],
    ];

    const tooltipBase = buildTooltipBase(tokens);

    const titleCase = new TitleCasePipe();
    const formattedPrincipal = titleCase.transform(principalName) || principalName;
    const formattedNeighbor = titleCase.transform(neighborName) || neighborName;

    return {
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const target = params.find((item) => item.seriesName === 'Curva de Dupla Massa') || params[0];
          const rawData = target?.data;
          if (!rawData || !Array.isArray(rawData)) return '';

          const [xVal, yVal] = rawData;
          const xFmt = Number(xVal).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
          const yFmt = Number(yVal).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });

          return `
            <div style="font-family: ${tokens.fontFamily}; font-size: 12px; line-height: 1.5;">
              <div style="font-weight: 600; color: ${tokens.text}; margin-bottom: 4px;">Curva de Dupla Massa</div>
              <div style="display: flex; justify-content: space-between; gap: 14px; margin-bottom: 2px;">
                <span style="color: ${tokens.textMuted}; font-size: 11px;">${formattedNeighbor} (X):</span>
                <strong style="color: ${tokens.text};">${xFmt} mm</strong>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 14px;">
                <span style="color: ${tokens.textMuted}; font-size: 11px;">${formattedPrincipal} (Y):</span>
                <strong style="color: ${tokens.text};">${yFmt} mm</strong>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 8,
        itemGap: 14,
        itemWidth: 20,
        itemHeight: 3,
        selectedMode: false,
        textStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
        },
        data: [
          {
            name: 'Curva de Dupla Massa',
            icon: 'path://M0,0 h25 v2.5 h-25 z',
            itemStyle: { color: tokens.primary },
          },
          {
            name: 'Relação ideal (1:1)',
            icon: 'path://M0,0 h6 v2.5 h-6 z M9.5,0 h6 v2.5 h-6 z M19,0 h6 v2.5 h-6 z',
            itemStyle: {
              color: tokens.textMuted,
            },
          },
        ],
      },
      grid: {
        left: 20,
        right: 20,
        top: 32,
        bottom: 32,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: `Vizinha: ${formattedNeighbor} (mm)`,
        nameLocation: 'middle',
        nameGap: 24,
        nameTextStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: buildAxisLineStyle(tokens),
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          formatter: (val: number) => formatAxisCompact(val),
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      yAxis: {
        type: 'value',
        name: 'Principal (mm)',
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
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          formatter: (val: number) => formatAxisCompact(val),
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [
        {
          name: 'Relação ideal (1:1)',
          type: 'line',
          data: diagonalLine,
          silent: true,
          showSymbol: false,
          lineStyle: {
            color: tokens.textMuted,
            type: 'dashed',
            width: 1.5,
            opacity: 0.7,
          },
        },
        {
          name: 'Curva de Dupla Massa',
          type: 'line',
          data: curvePoints,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: tokens.primary,
            width: 2.2,
          },
          itemStyle: {
            color: tokens.primary,
          },
        },
      ],
    };
  }
}
