import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { ThemeService } from './theme.service';
import { environment } from '../../../../environments/environment';
import { Station } from '../../models/api/station.model';

export interface MarkerOptions {
  color?: string;
  anchor?: mapboxgl.Anchor;
}

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  private map: mapboxgl.Map | undefined;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private resizeObserver: ResizeObserver | undefined;
  private themeSubscription!: Subscription;
  currentTheme: 'light' | 'dark' = 'light';

  private readonly mapStyles = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  private readonly defaultCenter: [number, number] = [-46.63, -23.54];
  private readonly defaultZoom = 9;

  private isReady$ = new BehaviorSubject<boolean>(false);
  readonly mapReady$ = this.isReady$.asObservable();

  constructor(private themeService: ThemeService) {}

  init(containerId: string, options?: { center?: [number, number]; zoom?: number }): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;

      if (this.map) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: containerId,
      style: this.mapStyles[this.currentTheme],
      center: options?.center ?? this.defaultCenter,
      zoom: options?.zoom ?? this.defaultZoom,
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    this.map.on('load', () => {
      this.isReady$.next(true);
    });

    this.listenToThemeChanges();
    this.setupResizeObserver(containerId);
  }

  destroy(): void {
    this.themeSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.clearMarkers();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    this.isReady$.next(false);
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  addStationMarker(station: Station, options?: MarkerOptions): mapboxgl.Marker {
    this.removeMarker(station.id);

    const el = this.createPinElement(options?.color ?? this.resolveStatusColor(station.status));

    const marker = new mapboxgl.Marker(el, {
      anchor: options?.anchor ?? 'bottom',
    })
      .setLngLat([station.longitude, station.latitude])
      .addTo(this.map!);

    this.markers.set(station.id, marker);
    return marker;
  }

  addStationMarkers(stations: Station[], options?: MarkerOptions): void {
    stations.forEach((station) => this.addStationMarker(station, options));
  }

  removeMarker(stationId: string): void {
    const existing = this.markers.get(stationId);
    if (existing) {
      existing.remove();
      this.markers.delete(stationId);
    }
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
  }

  flyToStation(station: Station, zoom = 13): void {
    this.map?.flyTo({
      center: [station.longitude, station.latitude],
      zoom,
      speed: 1.4,
      curve: 1.2,
    });
  }

  fitToMarkers(padding = 60): void {
    if (this.markers.size === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach((marker) => bounds.extend(marker.getLngLat()));
    this.map?.fitBounds(bounds, { padding, maxZoom: 14 });
  }

  resetCamera(): void {
    this.map?.flyTo({ center: this.defaultCenter, zoom: this.defaultZoom });
  }

  getMap(): mapboxgl.Map | undefined {
    return this.map;
  }

  private listenToThemeChanges(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      if (this.map) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });
  }

  private setupResizeObserver(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(container);
  }

  private createPinElement(color: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'custom-map-pin';
    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
           fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"
           stroke-linejoin="round" style="opacity: 0.95; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      </svg>
    `;
    return el;
  }

  private resolveStatusColor(status: Station['status']): string {
    const colors: Record<string, string> = {
      Active: '#49628b',
      Fault: '#f59e0b',
    };
    return colors[status] ?? '#6b7280';
  }
}
