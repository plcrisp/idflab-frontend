import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NeighborStation, StationSummary } from '../../../../../../core/models/api/station.model';
import { BRAZIL_STATES } from '../../../../../../shared/utils/brazil-states.constants';

@Component({
  selector: 'app-neighbor-stations-card',
  standalone: false,
  templateUrl: './neighbor-stations-card.html',
  styleUrl: './neighbor-stations-card.scss',
})
export class NeighborStationsCard {
  @Input() mainStation: StationSummary | null = null;
  @Input() neighbors: NeighborStation[] = [];
  @Input() selectedNeighbor: NeighborStation | null = null;
  @Input() loading: boolean = false;
  @Input() isLoadingData: boolean = false;

  @Output() stationSelected = new EventEmitter<NeighborStation>();
  @Output() skipClicked = new EventEmitter<void>();

  readonly states = BRAZIL_STATES;

  formatLocation(neighbor: NeighborStation): string {
    const stateName = this.states[neighbor.state ?? ''] || neighbor.state;
    if (neighbor.city && stateName) {
      return `${neighbor.city}, ${stateName}`;
    }
    return neighbor.city || stateName || 'ND';
  }

  get distantStations(): NeighborStation[] {
    return this.neighbors.filter((n) => n.distance_km > 100);
  }

  selectStation(station: NeighborStation): void {
    this.stationSelected.emit(station);

    const cardEl = document.getElementById(`neighbor-card-${station.id}`);
    cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  onSkip(): void {
    this.skipClicked.emit();
  }

  formatTemporalResolution(res?: string | null): string {
    if (!res) return '-';
    const lower = res.toLowerCase().trim();
    if (lower === 'hourly' || lower === 'hour') return 'Horária';
    if (lower === 'daily' || lower === 'day') return 'Diária';
    if (lower === 'monthly' || lower === 'month') return 'Mensal';
    if (lower.includes('10')) return '10 min';
    return res.charAt(0).toUpperCase() + res.slice(1);
  }

  formatCoveragePeriod(start?: string | null, end?: string | null): string {
    const startYear = start ? start.slice(0, 4) : null;
    const endYear = end ? end.slice(0, 4) : null;

    if (startYear && endYear) {
      return `${startYear} - ${endYear}`;
    }
    if (endYear) {
      return `Até ${endYear}`;
    }
    return '-';
  }
}

