import { formatTemporalResolution } from '../../../../core/utils/resolution.utils';
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

  readonly periodAndYearsText = computed(() => {
    const p = this.project();
    if (!p.start_date || !p.end_date) return '-';

    const start = new Date(p.start_date);
    const end = new Date(p.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${p.start_date} – ${p.end_date}`;
    }

    const s = `${String(start.getUTCMonth() + 1).padStart(2, '0')}/${start.getUTCFullYear()}`;
    const e = `${String(end.getUTCMonth() + 1).padStart(2, '0')}/${end.getUTCFullYear()}`;
    const years = Math.max(1, end.getUTCFullYear() - start.getUTCFullYear() + 1);
    const yearsSuffix = years === 1 ? 'ano' : 'anos';

    return `${s} – ${e} · ${years} ${yearsSuffix}`;
  });

  readonly translatedResolution = computed(() => {
    return formatTemporalResolution(this.project().station?.resolution);
  });

  readonly updatedAgoText = computed(() => {
    const raw = this.project().updated_at;
    if (!raw) return 'Atualizado recentemente';

    const updatedDate = new Date(raw);
    if (isNaN(updatedDate.getTime())) return 'Atualizado recentemente';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(updatedDate.getFullYear(), updatedDate.getMonth(), updatedDate.getDate());

    const diffMs = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Atualizado hoje';
    }
    if (diffDays === 1) {
      return 'Atualizado há 1 dia';
    }
    if (diffDays <= 30) {
      return `Atualizado há ${diffDays} dias`;
    }

    const day = String(updatedDate.getDate()).padStart(2, '0');
    const month = String(updatedDate.getMonth() + 1).padStart(2, '0');
    const year = updatedDate.getFullYear();
    return `Atualizado em ${day}/${month}/${year}`;
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
