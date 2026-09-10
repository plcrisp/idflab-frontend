import { Component, computed, input } from '@angular/core';
import { ActiveJobItem } from '../../../core/models/api/notification.model';

@Component({
  selector: 'app-job-progress-card',
  standalone: false,
  templateUrl: './job-progress-card.html',
  styleUrl: './job-progress-card.scss',
})
export class JobProgressCard {
  job = input.required<ActiveJobItem>();
  variant = input<'compact' | 'full'>('full');

  source = computed(() => {
    const details = this.job().details;
    return details?.source ?? null;
  });

  stageMessage = computed(() => {
    return this.job().details?.message ?? 'Processando requisição de dados...';
  });

  progress = computed(() => {
    return Math.min(100, Math.max(0, this.job().progress ?? 0));
  });
}
