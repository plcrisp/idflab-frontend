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
import { Marker, Station } from '../../../../core/models/api/station.model';

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

  isLoadingMap = true;

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

      setTimeout(() => {
        this.isLoadingMap = false;
        this.cdr.detectChanges();
      }, 300);
    });
  }

  onStationClick(station: Marker): void {
    this.mapService.flyToStation(station);
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }
}
