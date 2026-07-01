import { computed, Injectable, signal } from '@angular/core';
import { Marker, SidebarDashboardStats } from '../../models/api/station.model';

const EMPTY_STATS: SidebarDashboardStats = {
  totalStations: 0,
  activePercentage: 0,
  inmetCount: 0,
  cemadenCount: 0,
  anaCount: 0,
  inmetActiveShare: 0,
  cemadenActiveShare: 0,
  anaActiveShare: 0,
};

@Injectable({
  providedIn: 'root',
})
export class StationAnalyticsService {
  private readonly visibleStations = signal<Marker[]>([]);
  private readonly mapZoom = signal<number>(3.5);

  readonly stats = computed<SidebarDashboardStats>(() => {
    const stations = this.visibleStations();
    const total = stations.length;

    if (total === 0) {
      return EMPTY_STATS;
    }

    let inmet = 0;
    let cemaden = 0;
    let ana = 0;
    let inmetOperante = 0;
    let cemadenOperante = 0;
    let anaOperante = 0;

    for (let i = 0; i < total; i++) {
      const station = stations[i];
      const isOperante = station.status === 'Operante';

      switch (station.source) {
        case 'INMET':
          inmet++;
          if (isOperante) inmetOperante++;
          break;
        case 'CEMADEN':
          cemaden++;
          if (isOperante) cemadenOperante++;
          break;
        case 'ANA':
          ana++;
          if (isOperante) anaOperante++;
          break;
      }
    }

    const totalOperante = inmetOperante + cemadenOperante + anaOperante;

    return {
      totalStations: total,
      activePercentage: Math.round((totalOperante / total) * 100),
      inmetCount: inmet,
      cemadenCount: cemaden,
      anaCount: ana,
      inmetActiveShare: inmet > 0 ? Math.round((inmetOperante / total) * 100) : 0,
      cemadenActiveShare: cemaden > 0 ? Math.round((cemadenOperante / total) * 100) : 0,
      anaActiveShare: ana > 0 ? Math.round((anaOperante / total) * 100) : 0,
    };
  });

  updateVisibleStations(stations: Marker[], zoom: number): void {
    this.mapZoom.set(zoom);
    this.visibleStations.set(stations);
  }
}
