import { Injectable, OnDestroy, signal } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { ThemeService } from './theme.service';
import { environment } from '../../../../environments/environment';
import { Marker, Station, StationBBoxRequest } from '../../models/api/station.model';
import { StationService } from '../api/stations.service';
import { StationAnalyticsService } from './station-analytics.service';
import { BRAZIL_STATES } from '../../../shared/utils/brazil-states.constants';
import {
  CLUSTER_SOURCE,
  CLUSTER_LAYERS_IDS,
  getClusterSourceConfig,
  CLUSTER_LAYER,
  CLUSTER_COUNT_LAYER,
  UNCLUSTERED_POINT_LAYER,
  MAP_ICONS,
  getHoverPopupHtml,
} from '../../utils/map.utils';

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

  private resetAll$ = new Subject<void>();
  readonly resetAll$$ = this.resetAll$.asObservable();

  private allMarkers: Marker[] = [];

  readonly selectedCityStations = signal<Station[]>([]);
  readonly selectedCityCenter = signal<[number, number] | null>(null);
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

  clearStation(moveCamera: boolean = true): void {
    this.selectedStation.set(null);

    if (!moveCamera) return;

    const map = this.getMap();

    if (map) {
      const center = this.selectedCityCenter();

      if (center) {
        map.easeTo({
          center: center,
          zoom: 12,
          duration: 1000,
        });
      } else {
        const currentZoom = map.getZoom();

        map.easeTo({
          zoom: currentZoom - 1,
          duration: 1000,
        });
      }
    }
  }

  resetAll(): void {
    this.clearStation(false);
    this.selectedCityStations.set([]);
    this.selectedCityCenter.set(null);

    this.resetCamera();

    this.resetAll$.next();
  }

  private loadInitialMarkers(): void {
    this.stationService.getMarkers(this.brazilBBox).subscribe({
      next: (markers) => {
        this.allMarkers = markers;
        this.buildClusterLayers(markers);

        if (this.map) {
          const bounds = this.map.getBounds();
          const currentZoom = this.map!.getZoom();
          if (!bounds) return;
          const initialVisible = this.allMarkers.filter(
            (m) =>
              m.longitude >= bounds.getWest() &&
              m.longitude <= bounds.getEast() &&
              m.latitude >= bounds.getSouth() &&
              m.latitude <= bounds.getNorth(),
          );
          this.analyticsService.updateVisibleStations(initialVisible, currentZoom);
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

    this.map.addSource(CLUSTER_SOURCE, getClusterSourceConfig(geojson) as any);

    this.map.addLayer(CLUSTER_LAYER as any);
    this.map.addLayer(CLUSTER_COUNT_LAYER as any);

    await this.registerStatusIcons();

    this.map.addLayer(UNCLUSTERED_POINT_LAYER as any);

    this.setupClusterInteractions();
  }

  private async registerStatusIcons(): Promise<void> {
    if (!this.map) return;

    const loads = Object.entries(MAP_ICONS).map(([name, svg]) => {
      if (this.map!.hasImage(name)) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const img = new Image(24, 24);

        img.onload = () => {
          this.map!.addImage(name, img);
          resolve();
        };

        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      });
    });

    await Promise.all(loads);
  }

  private setupClusterInteractions(): void {
    if (!this.map) return;

    // Zoom in
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

    // Popup
    this.map.on('click', 'unclustered-point', (e) => {
      const props = e.features?.[0].properties;
      if (props) this.selectStation(props['id']);
    });

    // Cursors e Hover
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

      const html = getHoverPopupHtml(props, regionText);

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
    CLUSTER_LAYERS_IDS.forEach((layer) => {
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

      if (!bounds) return;

      const visibleStations = this.allMarkers.filter(
        (m) =>
          m.longitude >= bounds.getWest() &&
          m.longitude <= bounds.getEast() &&
          m.latitude >= bounds.getSouth() &&
          m.latitude <= bounds.getNorth(),
      );

      this.analyticsService.updateVisibleStations(visibleStations, currentZoom);
    });
  }

  private setupResizeObserver(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(container);
  }
}
