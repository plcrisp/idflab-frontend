import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { NeighborStation, StationSummary } from '../../../../../../core/models/api/station.model';
import { ThemeService } from '../../../../../../core/services/utils/theme.service';
import { environment } from '../../../../../../../environments/environment';
import { BRAZIL_STATES } from '../../../../../../shared/utils/brazil-states.constants';
import { MAP_COLORS, getHoverPopupHtml } from '../../../../../../core/utils/map.utils';

interface MarkerEntry {
  marker: mapboxgl.Marker;
  element: HTMLElement;
  neighbor: NeighborStation;
}

@Component({
  selector: 'app-neighbor-stations-map',
  standalone: false,
  templateUrl: './neighbor-stations-map.html',
  styleUrl: './neighbor-stations-map.scss',
})
export class NeighborStationsMap implements AfterViewInit, OnChanges, OnDestroy {
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);

  @Input() mainStation: StationSummary | null = null;
  @Input() neighbors: NeighborStation[] = [];
  @Input() selectedNeighbor: NeighborStation | null = null;
  @Input() loading: boolean = false;

  @Output() stationSelected = new EventEmitter<NeighborStation>();

  readonly containerId = `neighbor-mini-map-${Math.random().toString(36).substring(2, 9)}`;

  private map?: mapboxgl.Map;
  private resizeObserver?: ResizeObserver;
  private themeSubscription?: Subscription;
  private isMapReady = false;

  private mainMarker?: mapboxgl.Marker;
  private neighborMarkers: Map<string, MarkerEntry> = new Map();

  private readonly mapStyles: Record<'light' | 'dark', string> = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  private currentTheme: 'light' | 'dark' = 'light';

  private hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 16,
    className: 'minimal-hover-popup',
  });

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isMapReady || !this.map) return;

    if (changes['mainStation'] || changes['neighbors']) {
      this.rebuildAllMarkers();
      this.fitAllBounds();
    }

    if (changes['selectedNeighbor']) {
      this.updateSelectionVisuals();
      if (this.selectedNeighbor) {
        this.focusOnStation(this.selectedNeighbor);
      }
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.clearAllMarkers();
    this.hoverPopup.remove();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  private initMap(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
      if (this.map && this.isMapReady) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });

    const defaultCenter: [number, number] = this.mainStation
      ? [this.mainStation.longitude, this.mainStation.latitude]
      : [-51.9253, -14.235];

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: this.containerId,
      style: this.mapStyles[this.currentTheme],
      center: defaultCenter,
      zoom: 9,
      attributionControl: false,
    });

    // Controles de zoom nativos
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    this.map.on('load', () => {
      this.isMapReady = true;
      this.rebuildAllMarkers();
      this.fitAllBounds(600);
      if (this.selectedNeighbor) {
        this.updateSelectionVisuals();
      }
    });

    this.map.on('style.load', () => {
      if (this.isMapReady) {
        this.rebuildAllMarkers();
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

  private rebuildAllMarkers(): void {
    if (!this.map || !this.isMapReady) return;

    this.clearAllMarkers();

    // 1. Renderiza o Marcador da Estação Principal (Referência)
    if (this.mainStation?.latitude && this.mainStation?.longitude) {
      this.mainMarker = this.createMainStationMarker(this.mainStation);
      this.mainMarker.addTo(this.map);
    }

    // 2. Renderiza os Marcadores das Candidatas Vizinhas
    for (const neighbor of this.neighbors) {
      if (!neighbor.latitude || !neighbor.longitude) continue;

      const isSelected = this.selectedNeighbor?.id === neighbor.id;
      const markerEntry = this.createNeighborMarker(neighbor, isSelected);
      markerEntry.marker.addTo(this.map);
      this.neighborMarkers.set(neighbor.id, markerEntry);
    }

    this.updateSelectionVisuals();
  }

  private clearAllMarkers(): void {
    if (this.mainMarker) {
      this.mainMarker.remove();
      this.mainMarker = undefined;
    }

    this.neighborMarkers.forEach((entry) => entry.marker.remove());
    this.neighborMarkers.clear();
  }

  getMainStationColor(): string {
    const s = this.mainStation?.source?.toLowerCase() || '';
    if (s === 'cemaden') return MAP_COLORS.cemaden;
    if (s === 'ana') return MAP_COLORS.ana;
    return MAP_COLORS.inmet;
  }

  private createMainStationMarker(station: StationSummary): mapboxgl.Marker {
    const el = document.createElement('div');
    el.className = 'main-station-marker-container';
    const sourceColor = this.getMainStationColor();
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="main-pin" style="background-color: ${sourceColor};" title="Estação Principal: ${station.name}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `;

    const props = {
      name: station.name,
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

  private createNeighborMarker(neighbor: NeighborStation, isSelected: boolean): MarkerEntry {
    const el = document.createElement('div');
    el.className = `neighbor-marker-container ${isSelected ? 'is-selected' : ''}`;
    el.id = `mini-map-marker-${neighbor.id}`;
    el.innerHTML = `
      <div class="marker-wrapper">
        <span class="selection-ring"></span>
        <div class="shape-icon">
          ${this.getShapeSvg(neighbor.source)}
        </div>
      </div>
    `;

    const props = {
      name: neighbor.name,
      source: neighbor.source,
      status: 'operante',
      city: neighbor.city,
      state: neighbor.state,
    };
    const regionText = this.formatLocation(neighbor.city, neighbor.state);
    const html = getHoverPopupHtml(props, regionText);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onMarkerClick(neighbor);
    });

    el.addEventListener('mouseenter', () => {
      this.hoverPopup
        .setLngLat([neighbor.longitude, neighbor.latitude])
        .setHTML(html)
        .addTo(this.map!);
    });

    el.addEventListener('mouseleave', () => {
      this.hoverPopup.remove();
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([
      neighbor.longitude,
      neighbor.latitude,
    ]);

    return { marker, element: el, neighbor };
  }

  private getShapeSvg(source: string): string {
    const s = source?.toLowerCase() || '';
    if (s === 'inmet') {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="3.5" fill="${MAP_COLORS.inmet}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
        </svg>
      `;
    }
    if (s === 'ana') {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
          <polygon points="12,3 21,12 12,21 3,12" fill="${MAP_COLORS.ana}" stroke="${MAP_COLORS.border}" stroke-width="2.5" stroke-linejoin="round" />
        </svg>
      `;
    }
    // cemaden (círculo) por padrão
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="${MAP_COLORS.cemaden}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
      </svg>
    `;
  }

  private onMarkerClick(neighbor: NeighborStation): void {
    this.stationSelected.emit(neighbor);
    this.focusOnStation(neighbor);
  }

  private updateSelectionVisuals(): void {
    const selectedId = this.selectedNeighbor?.id;

    this.neighborMarkers.forEach((entry, id) => {
      const isSelected = id === selectedId;
      if (isSelected) {
        entry.element.classList.add('is-selected');
        entry.marker.getElement().style.zIndex = '35';
      } else {
        entry.element.classList.remove('is-selected');
        entry.marker.getElement().style.zIndex = '15';
      }
    });
  }

  private focusOnStation(neighbor: NeighborStation): void {
    if (!this.map || !this.isMapReady) return;

    const targetPos: [number, number] = [neighbor.longitude, neighbor.latitude];
    const bounds = this.map.getBounds();

    if (!bounds || !bounds.contains(targetPos)) {
      // Fora da tela: faz zoom out/pan suave para trazê-la para o enquadramento
      this.map.easeTo({
        center: targetPos,
        zoom: Math.max(this.map.getZoom(), 10),
        duration: 800,
      });
    } else {
      // Já visível: apenas centraliza suavemente
      this.map.easeTo({
        center: targetPos,
        duration: 600,
      });
    }
  }

  fitAllBounds(duration = 900): void {
    if (!this.map || !this.isMapReady) return;

    const bounds = new mapboxgl.LngLatBounds();
    let count = 0;

    if (this.mainStation?.latitude && this.mainStation?.longitude) {
      bounds.extend([this.mainStation.longitude, this.mainStation.latitude]);
      count++;
    }

    for (const neighbor of this.neighbors) {
      if (neighbor.latitude && neighbor.longitude) {
        bounds.extend([neighbor.longitude, neighbor.latitude]);
        count++;
      }
    }

    if (count > 0 && !bounds.isEmpty()) {
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
        duration,
      });
    }
  }

  private formatLocation(city?: string | null, state?: string | null): string {
    const stateName = BRAZIL_STATES[state ?? ''] || state;
    if (city && stateName) return `${city}, ${stateName}`;
    return city || stateName || 'ND';
  }
}
