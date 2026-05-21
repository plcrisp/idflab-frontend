import { Injectable, OnDestroy, signal } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { ThemeService } from './theme.service';
import { environment } from '../../../../environments/environment';
import { Marker, Station, StationBBoxRequest } from '../../models/api/station.model';
import { StationService } from '../api/stations.service';
import { StationAnalyticsService } from './station-analytics.service';
import { BRAZIL_STATES } from '../../../shared/utils/brazil-states.constants';

const CLUSTER_SOURCE = 'stations';

@Injectable({ providedIn: 'root' })
export class MapService implements OnDestroy {
  private map: mapboxgl.Map | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private themeSubscription!: Subscription;
  currentTheme: 'light' | 'dark' = 'light';

  private readonly mapStyles: Record<'light' | 'dark', string> = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  private hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 15,
    className: 'minimal-hover-popup',
  });

  private readonly defaultCenter: [number, number] = [-51.9253, -14.235];
  private readonly defaultZoom = 3.5;

  private readonly brazilBBox: StationBBoxRequest = {
    min_lat: -33.75,
    max_lat: 5.27,
    min_lon: -73.99,
    max_lon: -28.85,
    sources: ['INMET', 'CEMADEN'],
  };

  private isReady$ = new BehaviorSubject<boolean>(false);
  readonly mapReady$ = this.isReady$.asObservable();

  private allMarkers: Marker[] = [];

  readonly selectedCityStations = signal<Station[]>([]);
  readonly selectedStation = signal<Station | null>(null);

  constructor(
    private themeService: ThemeService,
    private stationService: StationService,
    private analyticsService: StationAnalyticsService,
  ) {}

  init(containerId: string, options?: { center?: [number, number]; zoom?: number }): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
      this.map?.setStyle(this.mapStyles[theme]);
    });

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: containerId,
      style: this.mapStyles[this.currentTheme],
      center: options?.center ?? this.defaultCenter,
      zoom: options?.zoom ?? this.defaultZoom,
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    this.setupMovementTracking();

    this.map.on('load', () => {
      this.isReady$.next(true);
      this.loadInitialMarkers();
    });

    this.map.on('style.load', () => {
      if (this.isReady$.value) {
        this.loadInitialMarkers();
      }
    });

    this.setupResizeObserver(containerId);
  }

  destroy(): void {
    this.themeSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    this.isReady$.next(false);
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  flyToStation(lat: number, long: number, zoom = 13): void {
    this.map?.flyTo({
      center: [long, lat],
      zoom,
      speed: 1.4,
      curve: 1.2,
    });
  }

  resetCamera(): void {
    this.map?.flyTo({ center: this.defaultCenter, zoom: this.defaultZoom });
  }

  getMap(): mapboxgl.Map | undefined {
    return this.map;
  }

  getMarkers(): Marker[] {
    return this.allMarkers;
  }

  selectStation(stationId: string): void {
    this.stationService.getStationByIdFromProvider(stationId).subscribe({
      next: (station: Station) => {
        this.flyToStation(station.latitude, station.longitude);
        this.selectedStation.set(station);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  clearStation(): void {
    this.selectedStation.set(null);
  }

  private loadInitialMarkers(): void {
    this.stationService.getMarkers(this.brazilBBox).subscribe({
      next: (markers) => {
        this.allMarkers = markers;
        this.buildClusterLayers(markers);

        if (this.map) {
          const bounds = this.map.getBounds();
          const currentZoom = this.map!.getZoom();
          const center = this.map!.getCenter();
          if (!bounds) return;
          const initialVisible = this.allMarkers.filter(
            (m) =>
              m.longitude >= bounds.getWest() &&
              m.longitude <= bounds.getEast() &&
              m.latitude >= bounds.getSouth() &&
              m.latitude <= bounds.getNorth(),
          );
          this.analyticsService.updateVisibleStations(initialVisible, currentZoom, center);
        }
      },
      error: (err) => console.error('Erro ao carregar estações:', err),
    });
  }

  private async buildClusterLayers(markers: Marker[]): Promise<void> {
    if (!this.map) return;

    this.removeClusterLayers();

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: markers.map((marker) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [marker.longitude, marker.latitude] },
        properties: {
          id: marker.id,
          state: marker.state,
          source: marker.source,
          status: marker.status,
          name: marker.name,
          city: marker.city,
        },
      })),
    };

    this.map.addSource(CLUSTER_SOURCE, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 60,
    });

    // cluster
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: CLUSTER_SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#49628b', 50, '#2a3c58', 500, '#1e2a3f'],
        'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 500, 24],
        'circle-opacity': 0.9,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(242, 242, 242, 0.4)',
      },
    });

    // cluster number
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: CLUSTER_SOURCE,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
        'text-font': ['Inter Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
      },
      paint: {
        'text-color': '#f2f2f2',
      },
    });

    await this.registerStatusIcons();

    // station
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: CLUSTER_SOURCE,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': [
          'concat',
          ['match', ['get', 'status'], 'Pane', 'icon-pane-', 'icon-operante-'],
          ['match', ['get', 'source'], 'INMET', 'inmet', 'cemaden'],
        ],
        'icon-size': 1,
        'icon-allow-overlap': true,
      },
    });

    this.setupClusterInteractions();
  }

  private async registerStatusIcons(): Promise<void> {
    const icons: Record<string, string> = {
      'icon-operante-cemaden': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="#49628b" stroke="#f2f2f2" stroke-width="1.5"/>
  </svg>`,

      'icon-operante-inmet': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="#1e2a3f" stroke="#f2f2f2" stroke-width="1.5"/>
    <circle cx="8" cy="8" r="2" fill="#f2f2f2"/>
  </svg>`,

      'icon-pane-cemaden': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <polygon points="8,2 14.5,13.5 1.5,13.5" fill="#f2f2f2" stroke="#49628b" stroke-width="2" stroke-linejoin="round"/>
  </svg>`,

      'icon-pane-inmet': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <polygon points="8,2 14.5,13.5 1.5,13.5" fill="#f2f2f2" stroke="#1e2a3f" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="8" cy="9.5" r="1.5" fill="#1e2a3f"/>
  </svg>`,
    };

    const loads = Object.entries(icons).map(([name, svg]) => {
      if (this.map!.hasImage(name)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image(16, 16);
        img.onload = () => {
          this.map!.addImage(name, img);
          resolve();
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      });
    });

    return Promise.all(loads).then(() => {});
  }

  private setupClusterInteractions(): void {
    if (!this.map) return;

    // zoom in
    this.map.on('click', 'clusters', (e) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties?.['cluster_id'];

      (this.map!.getSource(CLUSTER_SOURCE) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err || !zoom) return;
          this.map!.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        },
      );
    });

    // popup
    this.map.on('click', 'unclustered-point', (e) => {
      const props = e.features?.[0].properties;

      if (props) this.selectStation(props['id']);
    });

    // Cursors
    this.map.on('mouseenter', 'unclustered-point', (e) => {
      this.map!.getCanvas().style.cursor = 'pointer';

      const feature = e.features?.[0];
      if (!feature || !feature.properties || !feature.geometry) return;

      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [
        number,
        number,
      ];
      const props = feature.properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const regionText = props['city']
        ? `${props['city']}, ${props['state']}`
        : `${BRAZIL_STATES[props['state']]}`;
      const statusClass = (props['status'] || 'desconhecido').toLowerCase();

      const nameLower = props['name'] ? props['name'].toLowerCase() : '';

      const html = `
      <div class="hover-content">
        <div class="hover-header">
          <span class="hover-region">${regionText}</span>
          <div class="hover-dot ${statusClass}"></div>
        </div>
        <div class="hover-name">${nameLower}</div>
      </div>
    `;

      this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map!);
    });

    this.map.on('mouseleave', 'unclustered-point', () => {
      this.map!.getCanvas().style.cursor = '';
      this.hoverPopup.remove();
    });

    this.map.on('mouseenter', 'clusters', () => (this.map!.getCanvas().style.cursor = 'pointer'));
    this.map.on('mouseleave', 'clusters', () => (this.map!.getCanvas().style.cursor = ''));
  }

  private removeClusterLayers(): void {
    if (!this.map) return;
    ['unclustered-point', 'cluster-count', 'clusters'].forEach((layer) => {
      if (this.map!.getLayer(layer)) this.map!.removeLayer(layer);
    });
    if (this.map.getSource(CLUSTER_SOURCE)) this.map.removeSource(CLUSTER_SOURCE);
  }

  private setupMovementTracking(): void {
    if (!this.map) return;

    this.map.on('moveend', () => {
      if (this.allMarkers.length === 0) return;

      const bounds = this.map!.getBounds();
      const currentZoom = this.map!.getZoom();
      const center = this.map!.getCenter();

      if (!bounds) return;

      const visibleStations = this.allMarkers.filter(
        (m) =>
          m.longitude >= bounds.getWest() &&
          m.longitude <= bounds.getEast() &&
          m.latitude >= bounds.getSouth() &&
          m.latitude <= bounds.getNorth(),
      );

      this.analyticsService.updateVisibleStations(visibleStations, currentZoom, center);
    });
  }

  private setupResizeObserver(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(container);
  }
}
