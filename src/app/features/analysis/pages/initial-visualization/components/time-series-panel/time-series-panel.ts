import { Component, computed, input, Input, output, signal } from '@angular/core';
import { DetailResponse, YearlySummaryItem } from '../../models/initial-visualization.model';

@Component({
  selector: 'app-time-series-panel',
  standalone: false,
  templateUrl: './time-series-panel.html',
  styleUrl: './time-series-panel.scss',
  host: { class: 'block w-full min-w-0' },
})
export class TimeSeriesPanel {
  window = input<[string, string]>(['2026-01-01T00:00:00', '2026-01-31T00:00:00']);
  yearly_summary = input<YearlySummaryItem[]>([]);
  detail = input<DetailResponse | null>(null);
  max_value = input<number | null>(null);
  max_value_date = input<string | null>(null);
  selectedYear = input<number | null>(null);
  yearSelected = output<number>();
  rangeSelected = output<[string, string]>();

  readonly historicalMaxValue = computed<number | null>(() => {
    const direct = this.max_value();
    if (direct !== null && direct !== undefined) return direct;
    const summary = this.yearly_summary();
    if (!summary || !summary.length) return null;
    return summary.reduce<number | null>((best, item) => {
      if (item.max_value === null) return best;
      if (best === null || item.max_value > best) return item.max_value;
      return best;
    }, null);
  });

  onYearClick(year: number): void {
    this.yearSelected.emit(year);
  }

  firstYear = computed(() => {
    const summary = this.yearly_summary();
    return summary.length > 0 ? summary[0].year : null;
  });

  lastYear = computed(() => {
    const summary = this.yearly_summary();
    return summary.length > 0 ? summary[summary.length - 1].year : null;
  });

  minDate = computed<Date | undefined>(() => {
    const fy = this.firstYear();
    return fy !== null ? new Date(fy, 0, 1) : undefined;
  });

  maxDate = computed<Date | undefined>(() => {
    const ly = this.lastYear();
    return ly !== null ? new Date(ly, 11, 31) : undefined;
  });

  readonly pickerDate = computed<[Date, Date] | undefined>(() => {
    const win = this.window();
    if (!win || win.length < 2 || !win[0] || !win[1]) return undefined;

    const parseLocalDate = (s: string): Date => {
      const parts = s.slice(0, 10).split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      return new Date(y, m, d);
    };

    return [parseLocalDate(win[0]), parseLocalDate(win[1])];
  });

  readonly formatDates = (dates: [Date | undefined, Date | undefined]): string => {
    const [start, end] = dates;
    const fmt = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    if (start && end) return `${fmt(start)} - ${fmt(end)}`;
    if (start) return `${fmt(start)} - ...`;
    return '';
  };

  onDateRangeChange(dates: [Date, Date] | null): void {
    if (!dates || !dates[0] || !dates[1]) return;
    let [start, end] = dates;

    if (start.getTime() > end.getTime()) {
      const temp = start;
      start = end;
      end = temp;
    }

    const MAX_SPAN_MS = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > MAX_SPAN_MS) {
      end = new Date(start.getTime() + MAX_SPAN_MS);
    }

    const toIso = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}T00:00:00`;
    };

    this.rangeSelected.emit([toIso(start), toIso(end)]);
  }
}
