import { Component, inject } from '@angular/core';
import { Station } from '../../../../core/models/api/station.model';
import { MapService } from '../../../../core/services/utils/map.service';

@Component({
  selector: 'app-map-floating-panel',
  standalone: false,
  templateUrl: './map-floating-panel.html',
  styleUrl: './map-floating-panel.scss',
})
export class MapFloatingPanel {
  private mapService = inject(MapService);

  stations = this.mapService.selectedCityStations;
  station = this.mapService.selectedStation;
}
