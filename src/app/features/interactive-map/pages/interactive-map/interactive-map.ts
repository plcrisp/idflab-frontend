import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { MapService } from '../../../../core/services/utils/map.service';
import { Station } from '../../../../core/models/api/station.model';

@Component({
  selector: 'app-interactive-map',
  standalone: false,
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.scss',
})
export class InteractiveMap implements OnInit, AfterViewInit, OnDestroy {
  private mainLayoutService = inject(MainLayoutService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  readonly math = Math;

  isLoadingMap = true;

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

  ngOnInit(): void {
    this.mainLayoutService.setBreadcrumbs([
      { label: 'Nova Análise' },
      { label: 'Mapa Interativo', active: true },
    ]);

    this.mainLayoutService.setWorkflowStatus('1');

    if (!this.mainLayoutService.isSidebarCollapsed()) {
      this.mainLayoutService.toggleSidebar();
    }
  }

  ngAfterViewInit(): void {
    this.mapService.init('map');

    this.mapService.mapReady$.subscribe((ready) => {
      if (!ready) return;

      this.mapService.addStationMarkers(this.stations);

      setTimeout(() => {
        this.isLoadingMap = false;
        this.cdr.detectChanges();
      }, 300);
    });
  }

  onStationClick(station: Station): void {
    this.mapService.flyToStation(station);
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }
}
