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
    light: 'mapbox://styles/mapbox/streets-v12',
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

    this.MainLayoutService.setWorkflowStatus([
      { id: '1', label: 'Mapa Interativo', status: 'active' },
      { id: '2', label: 'Inspecionar Série', status: 'pending' },
      { id: '3', label: 'Tratamento de Falhas', status: 'pending' },
      { id: '4', label: 'Análise de Consistência', status: 'pending' },
      { id: '5', label: 'Desagregação Temporal', status: 'pending' },
      { id: '6', label: 'Modelagem Estatística', status: 'pending' },
      { id: '7', label: 'IDF Histórica', status: 'pending' },
    ]);

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
      el.className = `custom-marker ${station.status.toLowerCase()}`;

      new mapboxgl.Marker(el).setLngLat([station.longitude, station.latitude]).addTo(this.map!);
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
