import { Component, computed, inject } from '@angular/core';
import { Station } from '../../../../core/models/api/station.model';
import { MapService } from '../../../../core/services/utils/map.service';
import { hasInmetData } from '../../constants/inmet-stations.constants';

export interface StationListItem {
  station: Station;
  available: boolean;
  periodLabel: string;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseUtcDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getEffectiveSeries(station: Station, todayIso: string): {
  startYear: number;
  endYear: number | null;
  displayYears: number;
  exactYears: number;
} | null {
  const start = parseUtcDate(station.operation_start_date);
  if (!start) return null;

  if (!station.last_data_date) {
    return {
      startYear: start.getUTCFullYear(),
      endYear: null,
      displayYears: 0,
      exactYears: 0,
    };
  }

  const rawEnd = station.last_data_date <= todayIso ? station.last_data_date : todayIso;
  const end = parseUtcDate(rawEnd);

  if (!end || end.getTime() < start.getTime()) {
    return null;
  }

  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const exactYears = (end.getTime() - start.getTime()) / MS_PER_YEAR;
  const displayYears = Math.max(1, endYear - startYear + 1);

  return { startYear, endYear, displayYears, exactYears };
}

function computeIdfSuitabilityScore(
  station: Station,
  available: boolean,
  series: ReturnType<typeof getEffectiveSeries>,
  cityCenter: [number, number] | null,
): number {
  if (!available) return -1;

  let score = 0;

  // 1. Extensão da série histórica (critério principal para ajuste IDF)
  if (series && series.endYear !== null) {
    const years = series.exactYears;
    if (years >= 20) {
      score += 40 + Math.min(years - 20, 10);
    } else if (years >= 15) {
      score += 25 + (years - 15) * 2;
    } else {
      score += Math.min(years, 15);
    }

    // 2. Atualidade da série (possui dados depois de 2020)
    if (series.endYear > 2020) {
      score += 20;
    }
  }

  // 3. Proximidade ao centro da cidade buscada
  if (cityCenter) {
    const [centerLon, centerLat] = cityCenter;
    const distanceKm = haversineDistanceKm(
      station.latitude,
      station.longitude,
      centerLat,
      centerLon,
    );
    score += Math.max(0, 20 - distanceKm * 0.5);
  }

  // 4. Resolução temporal nativa (desempate)
  if (station.source === 'CEMADEN') {
    score += 10;
  } else if (station.source === 'INMET') {
    score += 5;
  }

  return score;
}

@Component({
  selector: 'app-station-list',
  standalone: false,
  templateUrl: './station-list.html',
  styleUrl: './station-list.scss',
})
export class StationList {
  private mapService = inject(MapService);

  stations = this.mapService.selectedCityStations;

  readonly sortedStations = computed<StationListItem[]>(() => {
    const rawStations = this.stations();
    const cityCenter = this.mapService.selectedCityCenter();
    const todayIso = new Date().toISOString().split('T')[0];

    return rawStations
      .map((station) => {
        const available = station.source !== 'INMET' || hasInmetData(station);
        const series = getEffectiveSeries(station, todayIso);
        const score = computeIdfSuitabilityScore(
          station,
          available,
          series,
          cityCenter,
        );

        let periodLabel = 'Período indisponível';
        if (!available) {
          periodLabel = 'Sem série';
        } else if (series) {
          if (series.endYear !== null) {
            const yearsSuffix = series.displayYears === 1 ? 'ano' : 'anos';
            periodLabel = `${series.startYear} - ${series.endYear} · ${series.displayYears} ${yearsSuffix}`;
          } else {
            periodLabel = `Desde ${series.startYear}`;
          }
        }

        return { station, available, periodLabel, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ station, available, periodLabel }) => ({
        station,
        available,
        periodLabel,
      }));
  });

  flyToStation(stationId: string) {
    this.mapService.selectStation(stationId);
  }
}
