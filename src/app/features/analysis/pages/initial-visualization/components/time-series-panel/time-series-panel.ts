import { Component, computed, input, Input, output, signal } from '@angular/core';
import { DetailResponse, YearlySummaryItem } from '../../models/initial-visualization.model';

@Component({
  selector: 'app-time-series-panel',
  standalone: false,
  templateUrl: './time-series-panel.html',
  styleUrl: './time-series-panel.scss',
})
export class TimeSeriesPanel {
  window = input<[string, string]>(['2026-01-01T00:00:00', '2026-01-31T00:00:00']);
  yearly_summary = input<YearlySummaryItem[]>([]);
  detail = input<DetailResponse | null>(null);
  max_value_date = input<string | null>(null);

  firstYear = computed(() => {
    const summary = this.yearly_summary();
    return summary.length > 0 ? summary[0].year : null;
  });

  lastYear = computed(() => {
    const summary = this.yearly_summary();
    return summary.length > 0 ? summary[summary.length - 1].year : null;
  });

  rangeLabel = computed(() => {
    const d = this.detail();
    if (!d?.points?.length) return '';

    const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
    const formatDate = (date: Date) =>
      `${monthFmt.format(date).replace('.', '')} ${date.getUTCFullYear()}`;

    const first = new Date(d.points[0].date);
    const last = new Date(d.points[d.points.length - 1].date);

    return `${formatDate(first)} - ${formatDate(last)}`;
  });
}
