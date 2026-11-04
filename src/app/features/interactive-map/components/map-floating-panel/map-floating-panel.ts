import { Component, inject } from '@angular/core';
import { MapService } from '../../../../core/services/utils/map.service';
import { BRAZIL_STATES } from '../../../../shared/utils/brazil-states.constants';

@Component({
  selector: 'app-map-floating-panel',
  standalone: false,
  templateUrl: './map-floating-panel.html',
  styleUrl: './map-floating-panel.scss',
})
export class MapFloatingPanel {
  readonly mapService = inject(MapService);

  readonly stations = this.mapService.selectedCityStations;
  readonly station = this.mapService.selectedStation;
  readonly isLoadingStation = this.mapService.isLoadingStation;
  readonly loadingMarker = this.mapService.loadingStationMarker;
  readonly states = BRAZIL_STATES;

  showStationTypeModal: boolean = false;

  toggleModal() {
    this.showStationTypeModal = !this.showStationTypeModal;
  }
}
