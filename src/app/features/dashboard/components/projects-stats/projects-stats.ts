import { Component, computed, input, output } from '@angular/core';
import { StatCardFooter } from '../../../../features/analysis/shared/models/analysis.models';
import { StatusFilterType } from '../projects-toolbar/projects-toolbar';

export interface ProjectStatsData {
  total: number;
  inProgress: number;
  completed: number;
}

@Component({
  selector: 'app-projects-stats',
  standalone: false,
  templateUrl: './projects-stats.html',
  styleUrl: './projects-stats.scss',
})
export class ProjectsStats {
  stats = input<ProjectStatsData>({ total: 0, inProgress: 0, completed: 0 });
  loading = input<boolean>(false);
  activeFilter = input<StatusFilterType>('ALL');

  filterChange = output<StatusFilterType>();

  readonly totalFooter = computed<StatCardFooter>(() => ({
    type: 'text',
    content: 'Estudos hidrológicos salvos',
  }));

  readonly inProgressFooter = computed<StatCardFooter>(() => {
    const s = this.stats();
    if (s.total === 0) {
      return { type: 'text', content: 'Nenhum projeto ativo' };
    }
    return {
      type: 'progress',
      value: s.inProgress,
      max: s.total,
      variant: 'warning',
    };
  });

  readonly completedFooter = computed<StatCardFooter>(() => {
    const s = this.stats();
    if (s.total === 0) {
      return { type: 'text', content: 'Nenhum estudo finalizado' };
    }
    return {
      type: 'progress',
      value: s.completed,
      max: s.total,
      variant: 'success',
    };
  });

  readonly inProgressBadge = computed(() => {
    const s = this.stats();
    if (s.total === 0) return null;
    const pct = Math.round((s.inProgress / s.total) * 100);
    return { label: `${pct}%`, variant: 'warning' as const };
  });

  readonly completedBadge = computed(() => {
    const s = this.stats();
    if (s.total === 0) return null;
    const pct = Math.round((s.completed / s.total) * 100);
    return { label: `${pct}%`, variant: 'success' as const };
  });

  onSelect(filter: StatusFilterType): void {
    this.filterChange.emit(filter);
  }
}
