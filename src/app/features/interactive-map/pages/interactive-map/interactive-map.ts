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
import { HlmSidebarService } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-interactive-map',
  standalone: false,
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.scss',
})
export class InteractiveMap implements OnInit, AfterViewInit, OnDestroy {
  private mainLayoutService = inject(MainLayoutService);
  private sidebarService = inject(HlmSidebarService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  isLoadingMap: boolean = true;

  ngOnInit(): void {
    this.mainLayoutService.setBreadcrumbs([
      { label: 'Nova Análise', url: '/app/dashboard' },
      { label: 'Mapa Interativo', url: '/app/analysis/interactive-map' },
    ]);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sidebarService.setOpen(false);
    }, 300);

    this.mapService.init('map');

    this.mapService.mapReady$.subscribe((ready) => {
      if (!ready) return;

      setTimeout(() => {
        this.isLoadingMap = false;

        this.cdr.detectChanges();
      }, 300);
    });
  }

  onStationClick(lat: number, long: number): void {
    this.mapService.flyToStation(lat, long);
  }

  ngOnDestroy(): void {
    this.mapService.destroy();
  }
}
