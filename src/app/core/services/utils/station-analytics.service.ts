import { computed, effect, Injectable, signal } from '@angular/core';
import { Marker, SidebarDashboardStats } from '../../models/api/station.model';
import { BRAZIL_STATES } from '../../../shared/utils/brazil-states.constants';

@Injectable({
  providedIn: 'root',
})
export class StationAnalyticsService {
  private readonly visibleStations = signal<Marker[]>([]);

  private readonly mapZoom = signal<number>(3.5);

  private readonly center = signal<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  readonly stats = computed<SidebarDashboardStats>(() => {
    const stations = this.visibleStations();
    const zoom = this.mapZoom();
    const center = this.center();

    if (stations.length === 0) {
      return {
        regionName: 'Nenhuma região visível',
        totalStations: 0,
        activePercentage: 0,
        inmetCount: 0,
        cemadenCount: 0,
      };
    }

    let inmet = 0;
    let cemaden = 0;
    let operante = 0;
    const stateCounts: Record<string, number> = {};

    for (const station of stations) {
      if (station.source === 'INMET') inmet++;
      else if (station.source === 'CEMADEN') cemaden++;

      if (station.status === 'Operante') operante++;

      if (station.state) {
        stateCounts[station.state] = (stateCounts[station.state] || 0) + 1;
      }
    }

    let regionName = 'Brasil';

    if (zoom >= 5 && stations.length > 0) {
      let closestStation = stations[0];
      let minDistance = Infinity;

      for (const st of stations) {
        const dist = Math.pow(st.longitude - center.lng, 2) + Math.pow(st.latitude - center.lat, 2);
        if (dist < minDistance) {
          minDistance = dist;
          closestStation = st;
        }
      }

      regionName = BRAZIL_STATES[closestStation.state] || closestStation.state;
    }

    const statsObj: SidebarDashboardStats = {
      regionName: regionName,
      totalStations: stations.length,
      activePercentage: Math.round((operante / stations.length) * 100),
      inmetCount: inmet,
      cemadenCount: cemaden,
    };

    return statsObj;
  });

  updateVisibleStations(
    stations: Marker[],
    zoom: number,
    center: { lat: number; lng: number },
  ): void {
    this.mapZoom.set(zoom);
    this.visibleStations.set(stations);
    this.center.set(center);
  }
}
