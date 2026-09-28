import { Component, computed, effect, ElementRef, input, output, ViewChild } from '@angular/core';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';

export type ConfirmationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NeighborProgressInfo {
  message?: string;
  percentage?: number;
}

@Component({
  selector: 'app-neighbor-station-confirmation',
  standalone: false,
  templateUrl: './neighbor-station-confirmation.html',
  styleUrl: './neighbor-station-confirmation.scss',
})
export class NeighborStationConfirmation {
  highlightedStation = input<NeighborStation | null>(null);
  activeStation = input<NeighborStation | null>(null);
  status = input<ConfirmationStatus>('idle');
  progress = input<NeighborProgressInfo | null>(null);
  job = input<ActiveJobItem | null>(null);

  confirmSelection = output<string>();
  lockSelection = output<boolean>();
  scrollToSelection = output<void>();

  @ViewChild('loadingCard') set loadingCardRef(el: ElementRef<HTMLElement> | undefined) {
    if (el?.nativeElement) {
      setTimeout(() => {
        const native = el.nativeElement;
        const rect = native.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const isFullyVisible = rect.top >= 20 && rect.bottom <= viewportHeight - 20;

        if (!isFullyVisible) {
          if (rect.height > viewportHeight - 40) {
            native.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            native.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }

  constructor() {
    effect(() => {
      const isLocked = this.status() === 'loading';
      this.lockSelection.emit(isLocked);
    });
  }

  readonly currentState = computed<'idle' | 'ready_to_confirm' | 'loading' | 'ready' | 'error'>(() => {
    const currentStatus = this.status();
    const highlighted = this.highlightedStation();
    const active = this.activeStation();

    if (currentStatus === 'loading') return 'loading';
    if (currentStatus === 'error') return 'error';

    if (currentStatus === 'ready') {
      if (highlighted && active && highlighted.id !== active.id) {
        return 'ready_to_confirm';
      }
      return 'ready';
    }

    // status === 'idle'
    if (highlighted) {
      return 'ready_to_confirm';
    }
    return 'idle';
  });

  readonly targetStation = computed<NeighborStation | null>(() => {
    const state = this.currentState();
    if (state === 'ready') {
      return this.activeStation();
    }
    return this.highlightedStation() ?? this.activeStation();
  });

  readonly isCemaden = computed<boolean>(() => {
    return this.targetStation()?.source?.toUpperCase() === 'CEMADEN';
  });

  onConfirm(): void {
    const station = this.targetStation();
    if (station?.id) {
      this.confirmSelection.emit(station.id);
    }
  }

  onRetry(): void {
    const station = this.targetStation();
    if (station?.id) {
      this.confirmSelection.emit(station.id);
    }
  }

  onScrollToSelection(): void {
    this.scrollToSelection.emit();
  }

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }
}
