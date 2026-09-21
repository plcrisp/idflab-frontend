import { Component, computed, input } from '@angular/core';
import { ActiveJobItem } from '../../../core/models/api/notification.model';

@Component({
  selector: 'app-job-progress-card',
  standalone: false,
  templateUrl: './job-progress-card.html',
  styleUrl: './job-progress-card.scss',
})
export class JobProgressCard {
  job = input<ActiveJobItem | null>(null);
  variant = input<'compact' | 'full'>('full');

  customTitle = input<string | null>(null);
  customSource = input<string | null>(null);
  customDescription = input<string | null>(null);
  customMessage = input<string | null>(null);
  customProgress = input<number | null>(null);
  extraWarning = input<string | null>(null);

  displayTitle = computed(() => {
    return this.customTitle() ?? this.job()?.project_name ?? '';
  });

  source = computed(() => {
    return this.customSource() ?? this.job()?.details?.source ?? null;
  });

  stageMessage = computed(() => {
    return this.customMessage() ?? this.job()?.details?.message ?? 'Processando requisição de dados...';
  });

  progress = computed(() => {
    const val = this.customProgress() ?? this.job()?.progress ?? 0;
    return Math.min(100, Math.max(0, val));
  });
}
