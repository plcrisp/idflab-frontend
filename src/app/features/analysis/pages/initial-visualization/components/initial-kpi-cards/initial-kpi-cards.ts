import { Component, input } from '@angular/core';
import { GlobalStats } from '../../models/initial-visualization.model';

@Component({
  selector: 'app-initial-kpi-cards',
  standalone: false,
  templateUrl: './initial-kpi-cards.html',
  styleUrl: './initial-kpi-cards.scss',
})
export class InitialKpiCards {
  stats = input<GlobalStats | null>(null);
  recordsLabel = input<string>('');
  loading = input<boolean>(false);
  muted = input<boolean>(false);
}
