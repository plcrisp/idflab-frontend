import { Component, input, output } from '@angular/core';
import { ProjectStatsData } from '../projects-stats/projects-stats';

export type StatusFilterType = 'ALL' | 'IN_PROGRESS' | 'COMPLETED';

@Component({
  selector: 'app-projects-toolbar',
  standalone: false,
  templateUrl: './projects-toolbar.html',
  styleUrl: './projects-toolbar.scss',
})
export class ProjectsToolbar {
  searchQuery = input<string>('');
  statusFilter = input<StatusFilterType>('ALL');
  stats = input<ProjectStatsData>({ total: 0, inProgress: 0, completed: 0 });

  searchQueryChange = output<string>();
  statusFilterChange = output<StatusFilterType>();
  clearFilters = output<void>();

  onSearchInput(value: string): void {
    this.searchQueryChange.emit(value);
  }

  onSelectStatus(status: StatusFilterType): void {
    this.statusFilterChange.emit(status);
  }

  onClearSearch(): void {
    this.searchQueryChange.emit('');
  }
}

