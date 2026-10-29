import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import {
  DistributionEnum,
  DistributionTableItem,
  DurationDetailResponse,
  DurationDistributionItem,
} from '../../models/statistical-distribution.model';
import {
  DISTRIBUTION_CONFIGS,
  DistributionConfig,
  getDistributionColor,
  getDistributionConfig,
} from '../../constants/statistical-distribution.constants';

@Component({
  selector: 'app-distribution-selection-table',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ...HlmBadgeImports,
    ...HlmSkeletonImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideInfo,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './distribution-selection-table.html',
  styleUrl: './distribution-selection-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionSelectionTable {
  readonly selectionTable = input<DistributionTableItem[]>([]);
  readonly selectedDistribution = input<DistributionEnum | null>(null);
  readonly suggestedDistribution = input<DistributionEnum | null>(null);
  readonly durationDetail = input<DurationDetailResponse | null>(null);
  readonly durationLabel = input<string>('1 h');
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly distributionSelected = output<DistributionEnum>();

  getConfig(code: DistributionEnum): DistributionConfig {
    return getDistributionConfig(code);
  }

  getColor(code: DistributionEnum): string {
    return getDistributionColor(code);
  }

  getDistDetail(code: DistributionEnum): DurationDistributionItem | null {
    const list = this.durationDetail()?.distributions;
    if (!list) return null;
    return list.find((d) => d.distribution === code) ?? null;
  }

  formatFailedDurations(durations: number[]): string {
    if (!durations || durations.length === 0) return 'Durações com falha no ajuste.';
    const formatted = durations
      .map((d) => (d < 60 ? `${d} min` : `${d / 60} h`))
      .join(', ');
    return `Falha no ajuste nas durações: ${formatted}`;
  }

  onRowClick(row: DistributionTableItem): void {
    if (row.status !== 'ok' || this.disabled()) {
      return;
    }
    this.distributionSelected.emit(row.distribution);
  }
}
