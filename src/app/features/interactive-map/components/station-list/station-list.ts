import { Component, inject, Input } from '@angular/core';
import { Station } from '../../../../core/models/api/station.model';
import { MapService } from '../../../../core/services/utils/map.service';

@Component({
  selector: 'app-station-list',
  standalone: false,
  templateUrl: './station-list.html',
  styleUrl: './station-list.scss',
})
export class StationList {
  private mapService = inject(MapService);

  readonly math = Math;

  stations = this.mapService.selectedCityStations;

  flyToStation(stationId: string) {
    this.mapService.selectStation(stationId);
  }
}
