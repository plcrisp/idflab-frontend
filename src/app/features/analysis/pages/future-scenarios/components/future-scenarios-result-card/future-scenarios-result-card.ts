import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUp,
  lucideChartColumn,
  lucideDatabase,
  lucideDroplets,
  lucideLoader2,
  lucidePercent,
  lucideShieldCheck,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import {
  BiasCorrectionMethod,
  CLIMATE_MODEL_CONFIGS,
  ClimateModel,
  FutureScenariosResult,
  FutureScenariosUiState,
} from '../../models/future-scenarios.model';
import { SharedModule } from '../../../../../../shared/shared-module';
import { StatCardSemanticVariant } from '../../../../shared/models/analysis.models';
import { FutureSeriesChart } from '../future-series-chart/future-series-chart';

@Component({
  selector: 'app-future-scenarios-result-card',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    NgIcon,
    HlmBadge,
    ...HlmButtonImports,
    FutureSeriesChart,
  ],
  providers: [
    provideIcons({
      lucideArrowUp,
      lucideDatabase,
      lucideTrendingUp,
      lucideChartColumn,
      lucidePercent,
      lucideLoader2,
      lucideTriangleAlert,
      lucideDroplets,
      lucideShieldCheck,
      lucideX,
    }),
  ],
  templateUrl: './future-scenarios-result-card.html',
  styleUrl: './future-scenarios-result-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class FutureScenariosResultCard {
  readonly result = input<FutureScenariosResult | null>(null);
  readonly uiState = input<FutureScenariosUiState>('INITIAL');
  readonly isProcessing = input<boolean>(false);
  readonly isOutdated = input<boolean>(false);
  readonly isEditing = input<boolean>(false);
  readonly editParams = output<void>();
  readonly cancelEdit = output<void>();
  readonly progressMessage = input<string>('Processando...');
  readonly progressPercentage = input<number>(10);
  readonly outdatedMessage = input<string>(
    'Configuração alterada. Clique em "Aplicar correção" para recalcular os cenários futuros com os novos parâmetros.',
  );

  readonly selectedMethod = input<BiasCorrectionMethod | null>('EQM');
  readonly selectedModel = input<ClimateModel>('MIROC6');
  readonly selectedSspLabel = input<string>('SSP2-4.5');

  readonly resultModel = computed<string>(() => {
    return this.result()?.applied_params?.model ?? this.selectedModel();
  });

  readonly modelColor = computed<string>(() => {
    const m = this.resultModel() as ClimateModel;
    return CLIMATE_MODEL_CONFIGS[m]?.color ?? '#3b82f6';
  });

  readonly resultMethod = computed<string>(() => {
    return this.result()?.applied_params?.method ?? this.selectedMethod() ?? 'EQM';
  });

  readonly methodIcon = computed<string>(() => {
    const method = this.resultMethod();
    if (method === 'QM') return 'lucideChartColumn';
    if (method === 'DBC') return 'lucidePercent';
    return 'lucideTrendingUp';
  });

  readonly resultSspLabel = computed<string>(() => {
    const ssp = this.result()?.applied_params?.ssp;
    if (ssp === 'SSP585') return 'SSP5-8.5';
    if (ssp === 'SSP245') return 'SSP2-4.5';
    return this.selectedSspLabel();
  });

  readonly resultPeriodLabel = computed<string>(() => {
    const ap = this.result()?.applied_params;
    if (ap?.start_year && ap?.end_year) {
      return `${ap.start_year} - ${ap.end_year}`;
    }
    if (ap?.period) {
      return ap.period.replace('-', ' - ');
    }
    return '';
  });

  formatMm(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  formatDeltaPct(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    const absRounded = Math.abs(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    if (Math.abs(value) < 0.05) return '0,0%';
    return value > 0 ? `+${absRounded}%` : `-${absRounded}%`;
  }

  getDeltaBadgeVariant(value: number | null | undefined): StatCardSemanticVariant {
    if (value == null || Number.isNaN(value)) return 'default';
    const abs = Math.abs(value);
    if (abs <= 5) return 'success';
    if (abs <= 15) return 'warning';
    return 'default';
  }

  getRawDeltaBadgeVariant(): StatCardSemanticVariant {
    return 'default';
  }
}
