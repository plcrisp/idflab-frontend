import { Component, computed, input, output } from '@angular/core';
import { Project } from '../../../../core/models/api/project.model';
import { getProjectPipelineStepInfo } from '../../../../core/utils/project-step.utils';

@Component({
  selector: 'app-project-card',
  standalone: false,
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
})
export class ProjectCard {
  project = input.required<Project>();
  isProcessing = input<boolean>(false);

  rename = output<Project>();
  delete = output<Project>();

  readonly stepInfo = computed(() => {
    return getProjectPipelineStepInfo(this.project().furthest_step);
  });

  readonly shouldShowStationName = computed(() => {
    const p = this.project();
    const projectName = (p.name || '').toLowerCase();
    const stationName = (p.station?.name || '').toLowerCase().trim();
    if (!stationName) return false;
    return !projectName.includes(stationName);
  });

  readonly formattedPeriod = computed(() => {
    const p = this.project();
    if (!p.start_date || !p.end_date) return '-';

    const start = new Date(p.start_date);
    const end = new Date(p.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${p.start_date} a ${p.end_date}`;
    }

    const s = `${String(start.getUTCMonth() + 1).padStart(2, '0')}/${start.getUTCFullYear()}`;
    const e = `${String(end.getUTCMonth() + 1).padStart(2, '0')}/${end.getUTCFullYear()}`;
    return `${s} a ${e}`;
  });

  readonly seriesYearsText = computed(() => {
    const p = this.project();
    if (!p.start_date || !p.end_date) return '';

    const start = new Date(p.start_date);
    const end = new Date(p.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const years = Math.max(1, end.getUTCFullYear() - start.getUTCFullYear() + 1);
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  });

  readonly translatedResolution = computed(() => {
    const res = this.project().station?.resolution?.toLowerCase();
    if (res === 'hourly') return 'Horária';
    if (res === 'daily') return 'Diária';
    if (res === 'monthly') return 'Mensal';
    return this.project().station?.resolution || 'Diária';
  });

  onRename(event: Event): void {
    event.stopPropagation();
    this.rename.emit(this.project());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.project());
  }
}

