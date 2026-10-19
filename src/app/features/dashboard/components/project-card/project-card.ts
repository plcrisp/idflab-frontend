import { Component, computed, input, output } from '@angular/core';
import { Project, StepEnum } from '../../../../core/models/api/project.model';

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

  readonly isCompleted = computed(() => {
    const s = this.project().furthest_step;
    return s === 'FUTURE_SCENARIOS' || s === 'RESULTS';
  });

  readonly stepInfo = computed(() => {
    const p = this.project();
    if (this.isCompleted()) {
      return {
        label: 'Concluído: Cenários Futuros',
        percent: 100,
      };
    }

    const mapping: Record<StepEnum, { num: number; name: string; pct: number }> = {
      INITIAL_VISUALIZATION: { num: 1, name: 'Visualização Inicial', pct: 14 },
      CONSISTENCY: { num: 2, name: 'Consistência', pct: 28 },
      GAP_FILLING: { num: 3, name: 'Tratamento de Falhas', pct: 43 },
      TEMPORAL_RESOLUTION: { num: 4, name: 'Resolução Temporal', pct: 57 },
      DISTRIBUTION: { num: 5, name: 'Distribuição Estatística', pct: 71 },
      HISTORICAL_IDF: { num: 6, name: 'IDF Histórica', pct: 86 },
      FUTURE_SCENARIOS: { num: 7, name: 'Cenários Futuros', pct: 100 },
      RESULTS: { num: 7, name: 'Cenários Futuros', pct: 100 },
    };

    const info = mapping[p.furthest_step] ?? {
      num: 1,
      name: 'Visualização Inicial',
      pct: 14,
    };
    return {
      label: `Etapa ${info.num} de 7: ${info.name}`,
      percent: info.pct,
    };
  });

  readonly formattedPeriod = computed(() => {
    const p = this.project();
    if (!p.start_date || !p.end_date) return '-';

    const start = new Date(p.start_date);
    const end = new Date(p.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${p.start_date} - ${p.end_date}`;
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
    return `${years} ${years === 1 ? 'ano' : 'anos'} de série`;
  });

  readonly translatedResolution = computed(() => {
    const res = this.project().station?.resolution?.toLowerCase();
    if (res === 'hourly') return 'Horária';
    if (res === 'daily') return 'Diária';
    if (res === 'monthly') return 'Mensal';
    return this.project().station?.resolution || 'Diária';
  });

  onRename(): void {
    this.rename.emit(this.project());
  }

  onDelete(): void {
    this.delete.emit(this.project());
  }
}
