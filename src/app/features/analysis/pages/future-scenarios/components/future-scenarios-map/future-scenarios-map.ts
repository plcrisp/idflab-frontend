import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMapPin } from '@ng-icons/lucide';

import { StationSummary } from '../../../../../../core/models/api/station.model';
import { ThemeService } from '../../../../../../core/services/utils/theme.service';
import { environment } from '../../../../../../../environments/environment';
import { BRAZIL_STATES } from '../../../../../../shared/utils/brazil-states.constants';
import { MAP_COLORS, getHoverPopupHtml } from '../../../../../../core/utils/map.utils';
import { ClimbraCell } from '../../models/future-scenarios.model';

const CIRCLE_SOURCE_ID = 'future-analysis-circle-source';
const CIRCLE_FILL_LAYER_ID = 'future-analysis-circle-fill';
const CIRCLE_LINE_LAYER_ID = 'future-analysis-circle-line';

const CELLS_SOURCE_ID = 'future-climbra-cells-source';
const CELLS_FILL_LAYER_ID = 'future-climbra-cells-fill';
const CELLS_LINE_LAYER_ID = 'future-climbra-cells-line';

const CELL_HALF_DEG = 0.125;

@Component({
  selector: 'app-future-scenarios-map',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [provideIcons({ lucideMapPin })],
  templateUrl: './future-scenarios-map.html',
  styleUrl: './future-scenarios-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FutureScenariosMap implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);
  private readonly titleCasePipe = new TitleCasePipe();

  readonly station = input<StationSummary | null>(null);
  readonly cells = input<ClimbraCell[] | null>(null);
  readonly radiusKm = input<number>(10);

  readonly containerId = `future-scenarios-mini-map-${Math.random().toString(36).substring(2, 9)}`;

  private map?: mapboxgl.Map;
  private resizeObserver?: ResizeObserver;
  private themeSubscription?: Subscription;
  private isMapReady = false;
  private mainMarker?: mapboxgl.Marker;

  private readonly mapStyles: Record<'light' | 'dark', string> = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  private currentTheme: 'light' | 'dark' = 'light';

  private readonly hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 16,
    className: 'minimal-hover-popup',
  });

  constructor() {
    effect(() => {
      this.station();
      this.cells();
      this.radiusKm();

      if (this.isMapReady && this.map) {
        this.renderMapFeatures();
        this.fitCircleBounds(500);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.mainMarker?.remove();
    this.hoverPopup.remove();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  getMainStationColor(): string {
    const s = this.station()?.source?.toLowerCase() || '';
    if (s === 'cemaden') return MAP_COLORS.cemaden;
    if (s === 'ana') return MAP_COLORS.ana;
    return MAP_COLORS.inmet;
  }

  fitCircleBounds(duration = 600): void {
    if (!this.map || !this.isMapReady) return;
    const st = this.station();
    if (!st || st.latitude == null || st.longitude == null) return;

    const bounds = new mapboxgl.LngLatBounds();
    const circleCoords = this.buildCircleCoordinates(
      st.latitude,
      st.longitude,
      this.radiusKm() || 10,
    );

    for (const pt of circleCoords) {
      bounds.extend(pt);
    }

    const cellsList = this.cells() ?? [];
    for (const c of cellsList) {
      bounds.extend([c.lon - CELL_HALF_DEG, c.lat - CELL_HALF_DEG]);
      bounds.extend([c.lon + CELL_HALF_DEG, c.lat + CELL_HALF_DEG]);
    }

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        maxZoom: 11,
        duration,
      });
    }
  }

  private initMap(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
      if (this.map && this.isMapReady) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });

    const st = this.station();
    const defaultCenter: [number, number] =
      st && st.longitude != null && st.latitude != null
        ? [st.longitude, st.latitude]
        : [-51.9253, -14.235];

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: this.containerId,
      style: this.mapStyles[this.currentTheme],
      center: defaultCenter,
      zoom: 9,
      attributionControl: false,
      interactive: false,
    });

    this.map.on('load', () => {
      this.isMapReady = true;
      this.renderMapFeatures();
      this.fitCircleBounds(0);
    });

    this.map.on('style.load', () => {
      if (this.isMapReady) {
        this.renderMapFeatures();
      }
    });

    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    const container = this.elementRef.nativeElement.querySelector(`#${this.containerId}`);
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.resize();
    });
    this.resizeObserver.observe(container);
  }

  private renderMapFeatures(): void {
    if (!this.map || !this.isMapReady) return;

    const st = this.station();
    this.mainMarker?.remove();
    this.mainMarker = undefined;

    if (!st || st.latitude == null || st.longitude == null) {
      return;
    }

    this.renderCellsOverlay(this.cells() ?? []);
    this.renderCircleOverlay(st.latitude, st.longitude, this.radiusKm() || 25);

    this.mainMarker = this.createMainStationMarker(st);
    this.mainMarker.addTo(this.map);
  }

  private renderCircleOverlay(lat: number, lon: number, radiusKm: number): void {
    if (!this.map) return;

    const coordinates = this.buildCircleCoordinates(lat, lon, radiusKm);
    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    };

    const existingSource = this.map.getSource(CIRCLE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojson);
    } else {
      this.map.addSource(CIRCLE_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });
    }

    const isLight = this.currentTheme === 'light';
    const strokeColor = isLight ? '#2563eb' : '#60a5fa';
    const fillColor = isLight ? '#3b82f6' : '#60a5fa';

    if (!this.map.getLayer(CIRCLE_FILL_LAYER_ID)) {
      this.map.addLayer({
        id: CIRCLE_FILL_LAYER_ID,
        type: 'fill',
        source: CIRCLE_SOURCE_ID,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': isLight ? 0.08 : 0.12,
        },
      });
    }

    if (!this.map.getLayer(CIRCLE_LINE_LAYER_ID)) {
      this.map.addLayer({
        id: CIRCLE_LINE_LAYER_ID,
        type: 'line',
        source: CIRCLE_SOURCE_ID,
        paint: {
          'line-color': strokeColor,
          'line-width': 1.75,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        },
      });
    }
  }

  private renderCellsOverlay(cells: ClimbraCell[]): void {
    if (!this.map) return;

    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = cells.map((c) => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [c.lon - CELL_HALF_DEG, c.lat - CELL_HALF_DEG],
            [c.lon + CELL_HALF_DEG, c.lat - CELL_HALF_DEG],
            [c.lon + CELL_HALF_DEG, c.lat + CELL_HALF_DEG],
            [c.lon - CELL_HALF_DEG, c.lat + CELL_HALF_DEG],
            [c.lon - CELL_HALF_DEG, c.lat - CELL_HALF_DEG],
          ],
        ],
      },
    }));

    const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: 'FeatureCollection',
      features,
    };

    const existingSource = this.map.getSource(CELLS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(featureCollection);
    } else {
      this.map.addSource(CELLS_SOURCE_ID, {
        type: 'geojson',
        data: featureCollection,
      });
    }

    const isLight = this.currentTheme === 'light';
    const cellFill = isLight ? '#0f766e' : '#14b8a6';
    const cellStroke = isLight ? '#0f766e' : '#2dd4bf';

    if (!this.map.getLayer(CELLS_FILL_LAYER_ID)) {
      this.map.addLayer({
        id: CELLS_FILL_LAYER_ID,
        type: 'fill',
        source: CELLS_SOURCE_ID,
        paint: {
          'fill-color': cellFill,
          'fill-opacity': isLight ? 0.18 : 0.22,
        },
      });
    }

    if (!this.map.getLayer(CELLS_LINE_LAYER_ID)) {
      this.map.addLayer({
        id: CELLS_LINE_LAYER_ID,
        type: 'line',
        source: CELLS_SOURCE_ID,
        paint: {
          'line-color': cellStroke,
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      });
    }
  }

  private buildCircleCoordinates(
    lat: number,
    lon: number,
    radiusKm: number,
    steps = 64,
  ): [number, number][] {
    const coords: [number, number][] = [];
    const dLat = radiusKm / 111.32;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const dLon = radiusKm / (111.32 * Math.max(0.01, cosLat));

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const pLon = lon + dLon * Math.cos(angle);
      const pLat = lat + dLat * Math.sin(angle);
      coords.push([pLon, pLat]);
    }
    return coords;
  }

  private createMainStationMarker(station: StationSummary): mapboxgl.Marker {
    const el = document.createElement('div');
    el.className = 'main-station-marker-container';
    const sourceColor = this.getMainStationColor();
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="main-pin" style="background-color: ${sourceColor};" title="Estação Principal: ${this.titleCasePipe.transform(station.name)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `;

    const props = {
      name: this.titleCasePipe.transform(station.name),
      source: station.source,
      status: 'operante',
      city: station.city,
      state: station.state,
    };
    const regionText = this.formatLocation(station.city, station.state);
    const html = getHoverPopupHtml(props, regionText);

    el.addEventListener('mouseenter', () => {
      this.hoverPopup
        .setLngLat([station.longitude, station.latitude])
        .setHTML(html)
        .addTo(this.map!);
    });

    el.addEventListener('mouseleave', () => {
      this.hoverPopup.remove();
    });

    return new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([
      station.longitude,
      station.latitude,
    ]);
  }

  private formatLocation(city?: string | null, state?: string | null): string {
    const stateName = BRAZIL_STATES[state ?? ''] || state;
    if (city && stateName) return `${city}, ${stateName}`;
    return city || stateName || 'ND';
  }
}

