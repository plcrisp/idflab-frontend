import { Component, computed, input } from '@angular/core';
import { GlobalStats } from '../../models/analysis.models';
import { formatMaxDate } from '../../../pages/initial-visualization/utils/initial-visualization.utils';

@Component({
  selector: 'app-station-summary-bar',
  standalone: false,
  templateUrl: './station-summary-bar.html',
  styleUrl: './station-summary-bar.scss',
})
export class StationSummaryBar {
  stats = input<GlobalStats | null>(null);
  recordsLabel = input<string>('Registros totais');
  maxLabel = input<string>('Máximo histórico');
  isHourly = input<boolean>(false);
  loading = input<boolean>(false);
  muted = input<boolean>(false);

  readonly formattedMaxDate = computed(() => {
    const s = this.stats();
    return formatMaxDate(s?.max_value_date, this.isHourly()) ?? '';
  });
}
