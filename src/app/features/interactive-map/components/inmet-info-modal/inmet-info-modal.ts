import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import {
  INMET_AVAILABLE_STATIONS,
  InmetStationSummary,
} from '../../constants/inmet-stations.constants';

@Component({
  selector: 'app-inmet-info-modal',
  standalone: false,
  templateUrl: './inmet-info-modal.html',
  styleUrl: './inmet-info-modal.scss',
})
export class InmetInfoModal {
  @Output() close = new EventEmitter<void>();
  @Output() selectStation = new EventEmitter<string>();

  readonly availableStations: InmetStationSummary[] = INMET_AVAILABLE_STATIONS;

  closeModal(): void {
    this.close.emit();
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  chooseStation(stationId: string): void {
    this.selectStation.emit(stationId);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }
}
