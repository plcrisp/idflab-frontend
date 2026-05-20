import { Component } from '@angular/core';
import { Station } from '../../../../core/models/api/station.model';

@Component({
  selector: 'app-map-floating-panel',
  standalone: false,
  templateUrl: './map-floating-panel.html',
  styleUrl: './map-floating-panel.scss',
})
export class MapFloatingPanel {
  readonly math = Math;

  stations: Station[] = [];
}
