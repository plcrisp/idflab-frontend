import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { MainLayoutService } from '../../../../core/services/main-layout.service';
import { environment } from '../../../../../environments/environment';
import { Station } from '../../models/stations.model';
import * as mapboxgl from 'mapbox-gl';
import { ThemeService } from '../../../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interactive-map',
  standalone: false,
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.scss',
})
export class InteractiveMap implements OnInit, OnDestroy, AfterViewInit {
  private MainLayoutService = inject(MainLayoutService);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  map: mapboxgl.Map | undefined;
  readonly math = Math;
  mapboxToken = environment.mapboxToken;

  currentTheme: 'light' | 'dark' = 'light';
  private themeSubscription!: Subscription;
  private readonly mapStyles = {
    light: 'mapbox://styles/plcrisp/cmp2yjqcu002301s67iowechc',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  center: [number, number] = [-46.63, -23.54];
  zoom: number = 9;

  isLoadingMap: boolean = true;

  stations: Station[] = [
    {
      id: '1',
      name: 'Mirante de Santana',
      source: 'INMET',
      code: 'A701',
      latitude: -23.496,
      longitude: -46.62,
      status: 'Active',
    },
    {
      id: '2',
      name: 'Parque Ibirapuera',
      source: 'CEMADEN',
      code: 'SP001',
      latitude: -23.586,
      longitude: -46.656,
      status: 'Active',
    },
    {
      id: '3',
      name: 'Vila Mariana',
      source: 'CEMADEN',
      code: 'SP002',
      latitude: -23.584,
      longitude: -46.638,
      status: 'Active',
    },
  ];

  ngOnInit() {
    this.MainLayoutService.setBreadcrumbs([
      { label: 'Nova Análise' },
      { label: 'Mapa Interativo', active: true },
    ]);

    this.MainLayoutService.setWorkflowStatus('1');

    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;

      if (this.map) {
        this.map.setStyle(this.mapStyles[theme]);
      }
    });
  }

  ngAfterViewInit() {
    this.map = new mapboxgl.Map({
      accessToken: this.mapboxToken,
      container: 'map',
      style: this.mapStyles[this.currentTheme],
      zoom: this.zoom,
      center: this.center,
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    this.map.on('load', () => {
      setTimeout(() => {
        this.isLoadingMap = false;
        this.cdr.detectChanges();
      }, 300);
    });

    this.addMarkersToMap();
  }

  private addMarkersToMap() {
    if (!this.map) return;

    this.stations.forEach((station) => {
      const el = document.createElement('div');
      el.className = 'custom-map-pin';

      const pinColor = station.status === 'Active' ? '#49628b' : '#f59e0b';

      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" 
             fill="${pinColor}" stroke="${pinColor}" stroke-width="1.5" stroke-linecap="round" 
             stroke-linejoin="round" style="opacity: 0.95; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        </svg>
      `;

      new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([station.longitude, station.latitude])
        .addTo(this.map!);
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
