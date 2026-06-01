import { computed, effect, Injectable, signal } from '@angular/core';
import { Marker, SidebarDashboardStats } from '../../models/api/station.model';
import { BRAZIL_STATES } from '../../../shared/utils/brazil-states.constants';

@Injectable({
  providedIn: 'root',
})
export class StationAnalyticsService {
  private readonly visibleStations = signal<Marker[]>([]);
  private readonly mapZoom = signal<number>(3.5);

  readonly stats = computed<SidebarDashboardStats>(() => {
    const stations = this.visibleStations();

    if (stations.length === 0) {
      return {
        totalStations: 0,
        activePercentage: 0,
        inmetCount: 0,
        cemadenCount: 0,
        inmetActivePercentage: 0,
        cemadenActivePercentage: 0,
      };
    }

    let inmet = 0;
    let cemaden = 0;
    let inmetOperante = 0;
    let cemadenOperante = 0;

    for (const station of stations) {
      if (station.source === 'INMET') {
        inmet++;
        if (station.status === 'Operante') inmetOperante++;
      } else if (station.source === 'CEMADEN') {
        cemaden++;
        if (station.status === 'Operante') cemadenOperante++;
      }
    }

    const total = stations.length;
    const totalOperante = inmetOperante + cemadenOperante;

    return {
      totalStations: total,
      activePercentage: Math.round((totalOperante / total) * 100),
      inmetCount: inmet,
      cemadenCount: cemaden,
      inmetActivePercentage: (inmetOperante / total) * 100,
      cemadenActivePercentage: (cemadenOperante / total) * 100,
    };
  });

  updateVisibleStations(stations: Marker[], zoom: number): void {
    this.mapZoom.set(zoom);
    this.visibleStations.set(stations);
  }
}
