import { Component, computed, ElementRef, input, output, ViewChild } from '@angular/core';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import {
  ConfirmationStatus,
  NeighborProgressInfo,
} from '../../models/consistency-check.model';

@Component({
  selector: 'app-neighbor-analysis-card',
  standalone: false,
  templateUrl: './neighbor-analysis-card.html',
  styleUrl: './neighbor-analysis-card.scss',
})
export class NeighborAnalysisCard {
  projectId = input<string | null>(null);
  activeStation = input<NeighborStation | null>(null);
  selectedStation = input<NeighborStation | null>(null);
  status = input<ConfirmationStatus>('idle');
  job = input<ActiveJobItem | null>(null);
  progress = input<NeighborProgressInfo | null>(null);
  isSelectionLocked = input<boolean>(false);

  changeStation = output<void>();

  @ViewChild('loadingContainer') set loadingContainerRef(el: ElementRef<HTMLElement> | undefined) {
    if (el?.nativeElement) {
      setTimeout(() => {
        const card = document.getElementById('neighbor-analysis-card') || el.nativeElement;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  /**
   * Estação a ser exibida no cabeçalho:
   * Durante 'loading', usa a estação recém-selecionada (selectedStation).
   * Em 'ready', usa a estação ativa e confirmada (activeStation).
   */
  readonly targetStation = computed<NeighborStation | null>(() => {
    if (this.status() === 'loading') {
      return this.selectedStation() ?? this.activeStation();
    }
    return this.activeStation();
  });

  onChangeStation(): void {
    if (this.isSelectionLocked()) return;
    this.changeStation.emit();
  }

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm == null) return '-';
    return `${distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  }
}
