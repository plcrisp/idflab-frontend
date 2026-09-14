import { Component, computed, input } from '@angular/core';
import { GlobalStats } from '../../models/initial-visualization.model';
import { formatMaxDate } from '../../utils/initial-visualization.utils';

@Component({
  selector: 'app-initial-kpi-cards',
  standalone: false,
  templateUrl: './initial-kpi-cards.html',
  styleUrl: './initial-kpi-cards.scss',
})
export class InitialKpiCards {
  stats = input<GlobalStats | null>(null);
  recordsLabel = input<string>('');
  isHourly = input<boolean>(false);
  loading = input<boolean>(false);
  muted = input<boolean>(false);

  readonly formattedMaxDate = computed(() => {
    const stats = this.stats();
    return formatMaxDate(stats?.max_value_date, this.isHourly()) ?? '';
  });
}

