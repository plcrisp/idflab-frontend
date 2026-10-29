import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  untracked,
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
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { finalize } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { FileDownloadService } from '../../../../../core/services/utils/file-download.service';
import { TemporalDisaggregationService } from '../../../services/temporal-disaggregation.service';
import { TemporalDisaggregationTableResponse } from '../../../pages/temporal-disaggregation/models/temporal-disaggregation.model';

@Component({
  selector: 'app-annual-max-table',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ...HlmButtonImports,
    ...HlmSkeletonImports,
    ...HlmSpinnerImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideArrowUp,
      lucideArrowDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideRotateCw,
      lucideTriangleAlert,
      lucideDownload,
    }),
  ],
  templateUrl: './annual-max-table.html',
  styleUrl: './annual-max-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnualMaxTable implements OnInit {
  readonly projectId = input.required<string>();
  readonly unit = input<'mm' | 'mm_h'>('mm');
  readonly footerText = input<string | null>(null);
  readonly maxHistoricalYear = input<number | null>(null);
  readonly isHybrid = input<boolean>(false);
  readonly pageSize = input<number>(10);

  private readonly disaggregationService = inject(TemporalDisaggregationService);
  private readonly fileDownloadService = inject(FileDownloadService);

  readonly isDownloadingTable = signal<boolean>(false);
  readonly tableData = signal<TemporalDisaggregationTableResponse | null>(null);
  readonly loadingTable = signal<boolean>(false);
  readonly errorTable = signal<string | null>(null);
  readonly page = signal<number>(1);
  readonly order = signal<'asc' | 'desc'>('asc');

  readonly totalPages = computed<number>(() => {
    const total = this.tableData()?.total_years ?? 0;
    const ps = this.pageSize();
    return total > 0 ? Math.ceil(total / ps) : 1;
  });

  readonly skeletonRows = computed<number[]>(() => {
    return Array.from({ length: this.pageSize() }, (_, i) => i + 1);
  });

  constructor() {
    effect(() => {
      const pid = this.projectId();
      const currentUnit = this.unit();
      if (!pid) return;

      untracked(() => {
        this.page.set(1);
        this.loadTable();
      });
    });
  }

  ngOnInit(): void {
    if (!this.tableData() && this.projectId()) {
      this.loadTable();
    }
  }

  loadTable(): void {
    const pid = this.projectId();
    if (!pid) return;

    this.loadingTable.set(true);
    this.errorTable.set(null);

    this.disaggregationService
      .getResultTable(pid, this.page(), this.pageSize(), this.order(), this.unit())
      .subscribe({
        next: (data) => {
          this.tableData.set(data);
          this.loadingTable.set(false);
        },
        error: (err) => {
          console.error('[AnnualMaxTable] Erro ao carregar tabela anual:', err);
          const msg = err?.error?.detail ?? 'Não foi possível carregar a tabela anual.';
          this.errorTable.set(msg);
          this.loadingTable.set(false);
        },
      });
  }

  toggleOrder(): void {
    this.order.update((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    this.page.set(1);
    this.loadTable();
  }

  prevPage(): void {
    if (this.page() > 1 && !this.loadingTable()) {
      this.page.update((p) => p - 1);
      this.loadTable();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages() && !this.loadingTable()) {
      this.page.update((p) => p + 1);
      this.loadTable();
    }
  }

  formatNumber(val?: number | null): string {
    if (val == null || isNaN(val)) return '-';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  onDownloadTable(): void {
    const projectId = this.projectId();
    if (!projectId || this.isDownloadingTable()) return;

    this.isDownloadingTable.set(true);

    this.disaggregationService
      .downloadTableCsv(projectId, ';', this.unit())
      .pipe(finalize(() => this.isDownloadingTable.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          try {
            this.fileDownloadService.triggerDownload(
              response,
              `precipitacao_maxima_anual_${this.unit()}_${projectId}.csv`,
            );
          } catch (err) {
            console.error('[AnnualMaxTable] erro ao processar arquivo baixado:', err);
            toast.error('Não foi possível baixar a tabela. Arquivo vazio.', {
              duration: 8000,
              position: 'bottom-center',
            });
          }
        },
        error: (err: unknown) => {
          console.error('[AnnualMaxTable] erro ao baixar CSV da tabela:', err);
          toast.error('Não foi possível exportar a tabela para CSV. Tente novamente.', {
            duration: 8000,
            position: 'bottom-center',
          });
        },
      });
  }
}

