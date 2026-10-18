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
import { HttpResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideChevronLeft,
  lucideChevronRight,
  lucideDownload,
  lucideRotateCw,
  lucideTable,
  lucideTrendingDown,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { finalize } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { EChartsOption } from 'echarts';

import { EchartsService } from '../../../../../../core/services/utils/echarts.service';
import { FileDownloadService } from '../../../../../../core/services/utils/file-download.service';
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
    HlmSpinnerImports,
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
      lucideDownload,
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
  private readonly fileDownloadService = inject(FileDownloadService);
  private readonly echarts = inject(EchartsService) as EchartsService<TemporalDisaggregationDecayCurveResponse>;

  readonly activeView = signal<'chart' | 'table'>('chart');
  readonly isDownloadingTable = signal<boolean>(false);

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

  readonly maxHistoricalYear = computed<number | null>(() => this.decayCurve()?.max_year ?? null);

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

  onDownloadTable(): void {
    const projectId = this.projectId();
    if (!projectId || this.isDownloadingTable()) return;

    this.isDownloadingTable.set(true);

    this.disaggregationService
      .downloadTableCsv(projectId)
      .pipe(finalize(() => this.isDownloadingTable.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `desagregacao_temporal_${projectId}.csv`,
            );
          } catch (err) {
            console.error('[TemporalDisaggregationResult] erro ao processar arquivo baixado:', err);
            toast.error('Não foi possível baixar a tabela. Arquivo vazio.', {
              duration: 8000,
              position: 'bottom-center',
            });
          }
        },
        error: (err: unknown) => {
          console.error('[TemporalDisaggregationResult] erro ao baixar CSV da tabela:', err);
          toast.error('Não foi possível exportar a tabela para CSV. Tente novamente.', {
            duration: 8000,
            position: 'bottom-center',
          });
        },
      });
  }


  private buildChartOption(data: TemporalDisaggregationDecayCurveResponse): EChartsOption {
    const tokens = this.echarts.getTokens();

    if (!data || !data.points || data.points.length === 0) {
      return {
        grid: { left: 24, right: 24, top: 32, bottom: 36, containLabel: true },
        xAxis: { type: 'log', min: 5, max: 1440 },
        yAxis: { type: 'log', min: 1, max: 1000 },
        series: [],
      };
    }

    const maxSeriesData = data.points.map((p) => [p.duration_minutes, p.max_intensity_mm_h]);
    const meanSeriesData = data.points.map((p) => [p.duration_minutes, p.mean_intensity_mm_h]);

    const keyDurations = [5, 15, 30, 60, 360, 1440];
    const durationLabelMap: Record<number, string> = {
      5: '5 min',
      15: '15 min',
      30: '30 min',
      60: '1 h',
      360: '6 h',
      1440: '24 h',
    };

    const allIntensities = [
      ...data.points.map((p) => p.max_intensity_mm_h),
      ...data.points.map((p) => p.mean_intensity_mm_h),
    ];
    const minIntensity = Math.min(...allIntensities);
    const maxIntensity = Math.max(...allIntensities);

    const yTicks = [1, 10, 100, 1000];
    if (minIntensity < 1) yTicks.unshift(0.1);
    if (maxIntensity > 1000) yTicks.push(10000);

    const tooltipBase = buildTooltipBase(tokens);

    return {
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const durationVal = Array.isArray(params[0].value) ? params[0].value[0] : null;
          const pt =
            data.points.find((p) => p.duration_minutes === durationVal) ??
            data.points[params[0].dataIndex];
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
                  <span style="color: ${tokens.historicalMax}; font-weight: 500;">Máximo histórico (${data.max_year}):</span>
                  <strong style="color: ${tokens.text}; font-variant-numeric: tabular-nums;">${maxIntFmt} mm/h</strong>
                </div>
                <div style="font-size: 11px; color: ${tokens.textMuted}; text-align: right;">
                  Precipitação: ${maxDepthFmt} mm
                </div>
              </div>
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                  <span style="color: ${tokens.primary}; font-weight: 500;">Média dos anos:</span>
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
            name: `Máximo histórico (${data.max_year})`,
            icon: 'roundRect',
            itemStyle: { color: tokens.historicalMax },
          },
          {
            name: 'Média dos anos',
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
        type: 'log',
        min: 5,
        max: 1440,
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
          customValues: keyDurations,
        },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          customValues: keyDurations,
          formatter: (val: number) => durationLabelMap[val] ?? `${val} min`,
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      yAxis: {
        type: 'log',
        name: 'Intensidade (mm/h)',
        nameLocation: 'end',
        min: yTicks[0],
        max: yTicks[yTicks.length - 1],
        nameTextStyle: {
          color: tokens.textMuted,
          fontFamily: tokens.fontFamily,
          fontSize: 11,
          fontWeight: 500,
          align: 'left',
          padding: [0, 0, 8, -14],
        },
        axisLine: buildAxisLineStyle(tokens),
        axisTick: {
          show: true,
          lineStyle: { color: tokens.border },
          customValues: yTicks,
        },
        axisLabel: {
          ...buildAxisLabelBase(tokens),
          customValues: yTicks,
          formatter: (val: number) => {
            if (val < 1) return val.toLocaleString('pt-BR');
            return Math.round(val).toLocaleString('pt-BR');
          },
        },
        splitLine: buildSplitLineStyle(tokens),
      },
      series: [
        {
          name: `Máximo histórico (${data.max_year})`,
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
          name: 'Média dos anos',
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
