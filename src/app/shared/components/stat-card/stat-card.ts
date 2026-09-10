import { Component, computed, input } from '@angular/core';
import { StatCardFooter } from '../../../features/analysis/shared/models/analysis.models';

@Component({
  selector: 'app-stat-card',
  standalone: false,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  label = input<string>('');
  icon = input<string>('');
  value = input<string | number | null | undefined>(null);
  unit = input<string | null | undefined>(undefined);
  footer = input<StatCardFooter>(null);
  loading = input<boolean>(false);
  muted = input<boolean>(false);

  readonly progressPercent = computed<number>(() => {
    const f = this.footer();
    if (f?.type !== 'progress' || !f.max) {
      return 0;
    }
    return Math.min(100, (f.value / f.max) * 100);
  });
}
