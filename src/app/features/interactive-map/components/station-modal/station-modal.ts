import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-station-modal',
  standalone: false,
  templateUrl: './station-modal.html',
  styleUrl: './station-modal.scss',
})
export class StationModal {
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
