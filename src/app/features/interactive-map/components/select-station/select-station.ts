import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MapService } from '../../../../core/services/utils/map.service';
import { BRAZIL_STATES } from '../../../../shared/utils/brazil-states.constants';

@Component({
  selector: 'app-select-station',
  standalone: false,
  templateUrl: './select-station.html',
  styleUrl: './select-station.scss',
})
export class SelectStation {
  mapService = inject(MapService);

  @Output() open = new EventEmitter<void>();

  station = this.mapService.selectedStation;
  stations = this.mapService.selectedCityStations;

  readonly states = BRAZIL_STATES;

  readonly today = new Date().toISOString().split('T')[0];

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

  openModal(): void {
    this.open.emit();
  }

  startAnalysis() {
    console.log('sim');
  }
}
