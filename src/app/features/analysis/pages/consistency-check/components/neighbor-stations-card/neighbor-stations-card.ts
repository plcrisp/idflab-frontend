import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NeighborStation, StationSummary } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import { BRAZIL_STATES } from '../../../../../../shared/utils/brazil-states.constants';
import {
  ConfirmationStatus,
  NeighborProgressInfo,
} from '../neighbor-station-confirmation/neighbor-station-confirmation';

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
  @Input() activeNeighborStation: NeighborStation | null = null;
  @Input() confirmationStatus: ConfirmationStatus = 'idle';
  @Input() neighborProgress: NeighborProgressInfo | null = null;
  @Input() neighborJob: ActiveJobItem | null = null;
  @Input() loading: boolean = false;
  @Input() isLoadingData: boolean = false;
  @Input() disabled: boolean = false;

  @Output() stationSelected = new EventEmitter<NeighborStation>();
  @Output() skipClicked = new EventEmitter<void>();
  @Output() confirmSelection = new EventEmitter<string>();
  @Output() lockSelection = new EventEmitter<boolean>();
  @Output() scrollToSelection = new EventEmitter<void>();

  readonly states = BRAZIL_STATES;

  formatLocation(neighbor: NeighborStation): string {
    const stateName = this.states[neighbor.state ?? ''] || neighbor.state;
    if (neighbor.city && stateName) {
      return `${neighbor.city}, ${stateName}`;
    }
    return neighbor.city || stateName || 'ND';
  }

  formatInlineLocation(neighbor: NeighborStation): string | null {
    const rawCity = neighbor.city?.trim();
    const rawState = neighbor.state?.trim();

    if (!rawCity && !rawState) return null;

    let formattedCity: string | null = null;
    if (rawCity) {
      const lower = rawCity.toLowerCase();
      formattedCity = lower
        .split(' ')
        .map((word, idx) => {
          if (idx > 0 && ['de', 'da', 'do', 'das', 'dos', 'e'].includes(word)) {
            return word;
          }
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    }

    const formattedState = rawState ? rawState.toUpperCase() : null;

    if (formattedCity && formattedState) {
      return `${formattedCity}, ${formattedState}`;
    }
    return formattedCity || formattedState || null;
  }

  get distantStations(): NeighborStation[] {
    return this.neighbors.filter((n) => n.distance_km > 100);
  }

  selectStation(station: NeighborStation): void {
    if (this.disabled) return;
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

