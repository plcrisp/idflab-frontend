import { Component, Input } from '@angular/core';
import { StatCardFooter } from '../../../../features/analysis/models/analysis.models';

@Component({
  selector: 'app-stat-card',
  standalone: false,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  @Input() label = '';
  @Input() icon = '';
  @Input() value: string | number | null | undefined = null;
  @Input() unit?: string | null | undefined;
  @Input() footer: StatCardFooter = null;

  get progressPercent(): number {
    if (this.footer?.type !== 'progress' || !this.footer.max) {
      return 0;
    }
    return Math.min(100, (this.footer.value / this.footer.max) * 100);
  }
}
