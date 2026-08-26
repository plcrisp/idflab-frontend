import { Component, computed, input } from '@angular/core';
import { YearlySummaryItem } from '../../../pages/initial-visualization/models/initial-visualization.model';

interface YearCell extends YearlySummaryItem {
  completeness: number;
  statusClass: 'full' | 'partial' | 'failure';
}

@Component({
  selector: 'app-data-availability-ribbon',
  standalone: false,
  templateUrl: './data-availability-ribbon.html',
  styleUrl: './data-availability-ribbon.scss',
})
export class DataAvailabilityRibbon {
  yearly_summary = input<YearlySummaryItem[]>([]);

  cells = computed<YearCell[]>(() =>
    this.yearly_summary().map((item) => ({
      ...item,
      completeness: 100 - item.failure_percentage,
      statusClass:
        item.coverage_status === 'complete'
          ? 'full'
          : item.coverage_status === 'partial'
            ? 'partial'
            : 'failure',
    })),
  );

  cellColor(status: YearCell['statusClass']): string {
    return {
      full: 'bg-(--success)',
      partial: 'bg-(--warning)',
      failure: 'bg-(--destructive)',
    }[status];
  }
}
