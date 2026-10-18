import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideChevronLeft,
  lucideChevronRight,
  lucideRotateCw,
  lucideTable,
  lucideTrendingDown,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { EChartsOption } from 'echarts';

import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import { TemporalDisaggregationService } from '../../../../services/temporal-disaggregation.service';
import {
  TemporalDisaggregationDecayCurveResponse,
  TemporalDisaggregationTableResponse,
} from '../../models/temporal-disaggregation.model';
import {
  buildAxisLabelBase,
  buildAxisLineStyle,
  buildSplitLineStyle,
  buildTooltipBase,
} from '../../../initial-visualization/utils/chart-options.utils';

@Component({
  selector: 'app-temporal-disaggregation-result',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButtonImports,
    HlmSkeletonImports,
    HlmTooltipImports,
  ],
  providers: [
    EchartsService,
    provideIcons({
      lucideTrendingDown,
      lucideTable,
      lucideArrowUp,
      lucideArrowDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideRotateCw,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './temporal-disaggregation-result.html',
  styleUrl: './temporal-disaggregation-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalDisaggregationResult implements OnInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly method = input<string>('CETESB');

  @ViewChild('chartContainer', { static: true })
  private chartContainer?: ElementRef<HTMLDivElement>;

  private readonly disaggregationService = inject(TemporalDisaggregationService);
  private readonly echarts = inject(EchartsService) as EchartsService<TemporalDisaggregationDecayCurveResponse>;

  readonly activeView = signal<'chart' | 'table'>('chart');

  // Estado da Curva de Decaimento
  readonly decayCurve = signal<TemporalDisaggregationDecayCurveResponse | null>(null);
  readonly loadingCurve = signal<boolean>(true);
  readonly errorCurve = signal<string | null>(null);

  // Estado da Tabela Paginada
  readonly tableData = signal<TemporalDisaggregationTableResponse | null>(null);
  readonly loadingTable = signal<boolean>(false);
  readonly errorTable = signal<string | null>(null);
  readonly page = signal<number>(1);
  readonly pageSize = 10;
  readonly order = signal<'asc' | 'desc'>('asc');

  readonly totalPages = computed<number>(() => {
    const total = this.tableData()?.total_years ?? 0;
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  });

  constructor() {
    this.echarts.setup({
      container: () => this.chartContainer?.nativeElement,
      data: computed(() => (this.loadingCurve() ? null : this.decayCurve())),
      buildOption: (data) => this.buildChartOption(data),
    });
  }

  ngOnInit(): void {
    this.loadDecayCurve();
  }

  ngOnDestroy(): void {
    this.echarts.destroy();
  }

  loadDecayCurve(): void {
    this.loadingCurve.set(true);
    this.errorCurve.set(null);

    this.disaggregationService.getResultDecayCurve(this.projectId()).subscribe({
      next: (data) => {
        this.decayCurve.set(data);
        this.loadingCurve.set(false);
      },
      error: (err) => {
        console.error('[TemporalDisaggregationResult] Erro ao carregar curva de decaimento:', err);
        const msg = err?.error?.detail ?? 'Não foi possível carregar a curva de decaimento.';
        this.errorCurve.set(msg);
        this.loadingCurve.set(false);
      },
    });
  }

  loadTable(): void {
    this.loadingTable.set(true);
    this.errorTable.set(null);

    this.disaggregationService
      .getResultTable(this.projectId(), this.page(), this.pageSize, this.order())
      .subscribe({
        next: (data) => {
          this.tableData.set(data);
          this.loadingTable.set(false);
        },
        error: (err) => {
          console.error('[TemporalDisaggregationResult] Erro ao carregar tabela de desagregação:', err);
          const msg = err?.error?.detail ?? 'Não foi possível carregar a tabela anual.';
          this.errorTable.set(msg);
          this.loadingTable.set(false);
        },
      });
  }

  switchView(view: 'chart' | 'table'): void {
    this.activeView.set(view);
    if (view === 'table' && !this.tableData()) {
      this.loadTable();
    } else if (view === 'chart') {
      setTimeout(() => this.echarts.resize(), 0);
    }
  }

  toggleOrder(): void {
    this.order.update((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    this.page.set(1);
    this.loadTable();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadTable();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadTable();
    }
  }

  formatNumber(val: number | null | undefined): string {
    if (val === null || val === undefined) return '—';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private buildChartOption(data: TemporalDisaggregationDecayCurveResponse): EChartsOption {
    const tokens = this.echarts.getTokens();

    if (!data || !data.points || data.points.length === 0) {
      return {
        grid: { left: 24, right: 24, top: 32, bottom: 36, containLabel: true },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [],
      };
    }

    const categories = data.points.map((p) => p.label);
    const maxSeriesData = data.points.map((p) => p.max_intensity_mm_h);
    const meanSeriesData = data.points.map((p) => p.mean_intensity_mm_h);

    const tooltipBase = buildTooltipBase(tokens);

    return {
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const pt = data.points[idx];
          if (!pt) return '';

          const maxIntFmt = pt.max_intensity_mm_h.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const maxDepthFmt = pt.max_depth_mm.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const meanIntFmt = pt.mean_intensity_mm_h.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const meanDepthFmt = pt.mean_depth_mm.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return `
            <div style="font-family: ${tokens.fontFamily}; font-size: 12px; line-height: 1.5; min-width: 190px;">
              <div style="font-weight: 600; color: ${tokens.text}; margin-bottom: 6px; border-bottom: 1px solid ${tokens.border}; padding-bottom: 4px;">
                Duração: ${pt.label}
              </div>
              <div style="margin-bottom: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                  <span style="color: ${tokens.historicalMax}; font-weight: 500;">Máx. Histórico (${data.max_year}):</span>
                  <strong style="color: ${tokens.text}; font-variant-numeric: tabular-nums;">${maxIntFmt} mm/h</strong>
                </div>
                <div style="font-size: 11px; color: ${tokens.textMuted}; text-align: right;">
                  Precipitação: ${maxDepthFmt} mm
                </div>
              </div>
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                  <span style="color: ${tokens.primary}; font-weight: 500;">Média dos Anos:</span>
                  <strong style="color: ${tokens.text}; font-variant-numeric: tabular-nums;">${meanIntFmt} mm/h</strong>
                </div>
                <div style="font-size: 11px; color: ${tokens.textMuted}; text-align: right;">
                  Precipitação: ${meanDepthFmt} mm
                </div>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 8,
        itemGap: 16,
        itemWidth: 16,
        itemHeight: 8,
        selectedMode: false,
        textStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
        },
        data: [
          {
            name: `Máximo Histórico (${data.max_year})`,
            icon: 'roundRect',
            itemStyle: { color: tokens.historicalMax },
          },
          {
            name: 'Média dos Anos',
            icon: 'roundRect',
            itemStyle: { color: tokens.primary },
          },
        ],
      },
      grid: {
        left: 20,
        right: 20,
        top: 36,
        bottom: 32,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        name: 'Duração',
        nameLocation: 'middle',
        nameGap: 24,
        nameTextStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 500,
        },
        axisLine: buildAxisLineStyle(tokens),
        axisLabel: buildAxisLabelBase(tokens),
        splitLine: buildSplitLineStyle(tokens),
      },
      yAxis: {
        type: 'value',
        name: 'Intensidade (mm/h)',
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
          formatter: (val: number) => val.toLocaleString('pt-BR'),
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [
        {
          name: `Máximo Histórico (${data.max_year})`,
          type: 'line',
          data: maxSeriesData,
          smooth: 0.25,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: tokens.historicalMax },
          lineStyle: {
            color: tokens.historicalMax,
            width: 2.5,
          },
        },
        {
          name: 'Média dos Anos',
          type: 'line',
          data: meanSeriesData,
          smooth: 0.25,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: tokens.primary },
          lineStyle: {
            color: tokens.primary,
            width: 2.2,
          },
        },
      ],
    };
  }
}
