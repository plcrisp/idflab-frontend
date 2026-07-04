import { Component, EventEmitter, OnInit, inject, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MapService } from '../../../../core/services/utils/map.service';
import { BRAZIL_STATES } from '../../../../shared/utils/brazil-states.constants';
import { ProjectsService } from '../../../../core/services/api/projects.service';
import { NotificationsService } from '../../../../core/services/api/notifications.service';
import { ProjectCreateRequest } from '../../../../core/models/api/project.model';
import { toast } from '@spartan-ng/brain/sonner';

@Component({
  selector: 'app-select-station',
  standalone: false,
  templateUrl: './select-station.html',
  styleUrl: './select-station.scss',
})
export class SelectStation implements OnInit {
  mapService = inject(MapService);
  private projectsService = inject(ProjectsService);
  private notificationsState = inject(NotificationsService);
  private fb = inject(FormBuilder);

  @Output() open = new EventEmitter<void>();

  station = this.mapService.selectedStation;
  stations = this.mapService.selectedCityStations;

  readonly states = BRAZIL_STATES;
  readonly today = new Date().toISOString().split('T')[0];

  isSubmitting = false;
  submitError: string | null = null;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        startDate: [this.minDate, Validators.required],
        endDate: [this.maxDate, Validators.required],
      },
      { validators: this.dateRangeValidator },
    );
  }

  get displayLastDate(): string | null {
    const s = this.station();
    if (!s?.last_data_date || s.last_data_date > this.today) {
      return null;
    }
    return s.last_data_date;
  }

  get maxDate(): string {
    const s = this.station();
    if (!s?.last_data_date || s.last_data_date > this.today) {
      return this.today;
    }
    return s.last_data_date;
  }

  get minDate(): string {
    const s = this.station();
    return s?.operation_start_date ? s.operation_start_date : '1900-01-01';
  }

  // Validador de grupo: garante que startDate <= endDate
  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (!start || !end) return null;

    return start > end ? { dateRangeInvalid: true } : null;
  }

  private buildProjectName(stationName: string): string {
    const formatted = new Date().toLocaleDateString('pt-BR');

    const formattedName = stationName
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${formattedName} - ${formatted}`;
  }

  openModal(): void {
    this.open.emit();
  }

  startAnalysis(): void {
    this.submitError = null;
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const station = this.station();
    if (!station) return;

    const { startDate, endDate } = this.form.value;

    this.isSubmitting = true;

    const project_name = this.buildProjectName(station.name);

    const payload: ProjectCreateRequest = {
      station_id: station.id,
      name: project_name,
      start_date: startDate,
      end_date: endDate,
    };

    this.projectsService.createProject(payload).subscribe({
      next: () => {
        this.notificationsState.refetch();
      },
      error: (err) => {
        console.error('Erro ao iniciar análise', err);
        this.submitError = 'Não foi possível iniciar a análise. Tente novamente.';
        this.isSubmitting = false;
      },
      complete: () => {
        toast.success(`Os dados para o projeto ${project_name} estão sendo requisitados.`, {
          duration: 8000,
          position: 'bottom-center',
        });

        this.mapService.clearStation();
        this.mapService.selectedCityStations.set([]);
        this.mapService.selectedCityCenter.set(null);

        const map = this.mapService.getMap();

        if (map) {
          map.flyTo({
            center: [-51.9253, -14.235],
            zoom: 3.5,
            speed: 1.4,
            curve: 1.2,
          });
        }
        this.isSubmitting = false;
      },
    });
  }
}
