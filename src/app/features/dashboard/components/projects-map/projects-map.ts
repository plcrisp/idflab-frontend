import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { Project } from '../../../../core/models/api/project.model';
import { ThemeService } from '../../../../core/services/utils/theme.service';
import { environment } from '../../../../../environments/environment';
import { MAP_COLORS, getHoverPopupHtml } from '../../../../core/utils/map.utils';
import { BRAZIL_STATES } from '../../../../shared/utils/brazil-states.constants';

interface MappedProjectItem {
  project: Project;
  coords: { lon: number; lat: number };
}

@Component({
  selector: 'app-projects-map',
  standalone: false,
  templateUrl: './projects-map.html',
  styleUrl: './projects-map.scss',
})
export class ProjectsMap implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);
  private readonly titleCasePipe = new TitleCasePipe();

  projects = input<Project[]>([]);

  readonly containerId = `projects-map-${Math.random().toString(36).substring(2, 9)}`;

  private map?: mapboxgl.Map;
  private resizeObserver?: ResizeObserver;
  private themeSubscription?: Subscription;
  private isMapReady = false;
  private markers: mapboxgl.Marker[] = [];

  private hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 16,
    className: 'minimal-hover-popup',
  });

  private activePopup?: mapboxgl.Popup;

  private readonly mapStyles: Record<'light' | 'dark', string> = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  private currentTheme: 'light' | 'dark' = 'light';

  readonly mappedProjects = computed<MappedProjectItem[]>(() => {
    const list = this.projects();
    const result: MappedProjectItem[] = [];

    for (const project of list) {
      const coords = this.extractCoordinates(project);
      if (coords) {
        result.push({ project, coords });
      }
    }

    return result;
  });

  readonly mappedCount = computed<number>(() => this.mappedProjects().length);

  constructor() {
    effect(() => {
      // Reagir reativamente a mudanças na lista de projetos
      const items = this.mappedProjects();
      if (this.isMapReady && this.map) {
        this.rebuildMarkers();
        this.fitAllBounds(600);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
      if (this.map && this.isMapReady) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });

    const defaultCenter: [number, number] = [-51.9253, -14.235]; // Centro do Brasil

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: this.containerId,
      style: this.mapStyles[this.currentTheme],
      center: defaultCenter,
      zoom: 4,
      attributionControl: false,
    });

    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    this.map.on('load', () => {
      this.isMapReady = true;
      this.map?.resize();
      this.rebuildMarkers();
      this.fitAllBounds(800);
    });

    this.map.on('style.load', () => {
      if (this.isMapReady) {
        this.rebuildMarkers();
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

  private rebuildMarkers(): void {
    if (!this.map || !this.isMapReady) return;

    this.clearMarkers();

    const items = this.mappedProjects();
    for (const item of items) {
      const marker = this.createMarker(item.project, item.coords.lon, item.coords.lat);
      marker.addTo(this.map);
      this.markers.push(marker);
    }
  }

  private clearMarkers(): void {
    this.hoverPopup.remove();
    this.activePopup?.remove();
    this.activePopup = undefined;

    for (const marker of this.markers) {
      marker.remove();
    }
    this.markers = [];
  }

  private createMarker(project: Project, lon: number, lat: number): mapboxgl.Marker {
    const el = document.createElement('div');
    el.className = 'project-marker-container';
    el.id = `project-map-marker-${project.id}`;

    const source = (project.station?.source || 'INMET').toUpperCase();
    const stationName = project.station?.name || project.name;
    const city = project.station?.city ?? null;
    const state = project.station?.state ?? null;
    const regionText = this.formatLocation(city, state);

    el.innerHTML = `
      <div class="marker-wrapper">
        <div class="shape-icon">
          ${this.getShapeSvg(source)}
        </div>
      </div>
    `;

    // 1. Hover Popup (minimal-hover-popup)
    const hoverHtml = getHoverPopupHtml(
      {
        name: this.titleCasePipe.transform(stationName),
        source,
        status: 'operante',
        city,
        state,
      },
      regionText,
    );

    el.addEventListener('mouseenter', () => {
      if (!this.activePopup?.isOpen()) {
        this.hoverPopup
          .setLngLat([lon, lat])
          .setHTML(hoverHtml)
          .addTo(this.map!);
      }
    });

    el.addEventListener('mouseleave', () => {
      this.hoverPopup.remove();
    });

    // 2. Click Handler: Centraliza o mapa e abre card interativo de navegação
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hoverPopup.remove();
      this.activePopup?.remove();

      this.map?.easeTo({
        center: [lon, lat],
        duration: 400,
      });

      const sourceColor = this.getSourceColor(source);
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 flex flex-col gap-1.5 min-w-[190px] max-w-[250px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            ${this.escapeHtml(regionText)}
          </span>
          <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0" style="background-color: ${sourceColor}20; color: ${sourceColor};">
            ${this.escapeHtml(source)}
          </span>
        </div>
        <span class="font-semibold text-xs text-foreground leading-snug line-clamp-2">
          ${this.escapeHtml(project.name)}
        </span>
        <span class="text-[11px] text-muted-foreground truncate">
          Estação: ${this.escapeHtml(this.titleCasePipe.transform(stationName))}
        </span>
        <a href="/app/analysis/${project.id}" class="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer">
          Continuar análise →
        </a>
      `;

      const link = popupContent.querySelector('a');
      if (link) {
        link.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.router.navigate(['/app/analysis', project.id]);
        });
      }

      this.activePopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 16,
        className: 'minimal-project-popup',
      })
        .setDOMContent(popupContent)
        .setLngLat([lon, lat])
        .addTo(this.map!);
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lon, lat]);
    return marker;
  }

  private getShapeSvg(source?: string): string {
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

  private getSourceColor(source?: string): string {
    const s = source?.toLowerCase() || '';
    if (s === 'cemaden') return MAP_COLORS.cemaden;
    if (s === 'ana') return MAP_COLORS.ana;
    return MAP_COLORS.inmet;
  }

  private extractCoordinates(project: Project): { lon: number; lat: number } | null {
    const st = project.station as any;
    const rawLat = st?.latitude ?? st?.lat ?? project.latitude ?? (project as any)?.lat;
    const rawLon =
      st?.longitude ??
      st?.lon ??
      st?.lng ??
      project.longitude ??
      (project as any)?.lon ??
      (project as any)?.lng;

    if (rawLat == null || rawLon == null) return null;

    const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
    const lon = typeof rawLon === 'string' ? parseFloat(rawLon) : Number(rawLon);

    if (isNaN(lat) || isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    return { lon, lat };
  }

  private formatLocation(city?: string | null, state?: string | null): string {
    const stateName = BRAZIL_STATES[state ?? ''] || state;
    if (city && stateName) return `${city}, ${stateName}`;
    return city || stateName || 'Localização não informada';
  }

  fitAllBounds(duration = 700): void {
    if (!this.map || !this.isMapReady) return;

    this.map.resize();

    const items = this.mappedProjects();
    if (items.length === 0) return;

    if (items.length === 1) {
      this.map.easeTo({
        center: [items[0].coords.lon, items[0].coords.lat],
        zoom: 6.5,
        duration,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    for (const item of items) {
      bounds.extend([item.coords.lon, item.coords.lat]);
    }

    if (!bounds.isEmpty()) {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      // Se todos os projetos tiverem as mesmas coordenadas
      if (Math.abs(sw.lng - ne.lng) < 0.0001 && Math.abs(sw.lat - ne.lat) < 0.0001) {
        this.map.easeTo({
          center: [sw.lng, sw.lat],
          zoom: 6.5,
          duration,
        });
        return;
      }

      this.map.fitBounds(bounds, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: 8,
        duration,
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  ngOnDestroy(): void {
    this.clearMarkers();
    this.resizeObserver?.disconnect();
    this.themeSubscription?.unsubscribe();
    this.map?.remove();
  }
}
