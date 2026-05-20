import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, map } from 'rxjs';
import { MapService } from '../../../../core/services/utils/map.service';
import { StationService } from '../../../../core/services/api/stations.service';
import { GeocodingService, MapboxFeature } from '../../../../core/services/utils/geocoding.service';

interface DropdownItem {
  feature: MapboxFeature;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-station-search',
  standalone: false,
  templateUrl: './station-search.html',
  styleUrl: './station-search.scss',
})
export class StationSearch {
  searchControl = new FormControl('');
  isLoading = signal(false);
  activeIndex = signal(-1);
  private selected = signal<string | null>(null);

  results = signal<DropdownItem[]>([]);

  isOpen = computed(() => this.results().length > 0 && !this.selected());

  constructor(
    private mapService: MapService,
    private stationService: StationService,
    private elRef: ElementRef,
    private geocodingService: GeocodingService,
  ) {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((term) => (term || '').length > 2),
        switchMap((term) => {
          this.isLoading.set(true);

          return this.geocodingService.searchCity(term!).pipe(
            map((features) =>
              features.map((f) => {
                const subtitle = f.place_name.replace(`${f.text}, `, '');

                return {
                  feature: f,
                  title: f.text,
                  subtitle,
                };
              }),
            ),
            catchError(() => of([] as DropdownItem[])),
          );
        }),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.isLoading.set(false);
      });
  }

  select(item: DropdownItem): void {
    const feature = item.feature;

    this.mapService.getMap()?.flyTo({
      center: feature.center,
      zoom: 12,
    });

    this.isLoading.set(true);

    const regionContext = feature.context.find((c) => c.id.startsWith('region'));
    const stateCode = regionContext ? regionContext.short_code.replace('BR-', '') : '';

    this.stationService.searchStations(stateCode, feature.text).subscribe({
      next: (stations) => {
        this.isLoading.set(false);
        this.mapService.selectedCityStations.set(stations);
        console.log(stations);
      },
      error: () => this.isLoading.set(false),
    });

    this.selected.set(item.title);
    this.searchControl.setValue(item.feature.place_name, { emitEvent: false });
    this.results.set([]);
    this.activeIndex.set(-1);
  }

  clear(): void {
    this.searchControl.setValue('');
    this.selected.set(null);
    this.activeIndex.set(-1);
    this.selected.set('__close__');
    this.results.set([]);

    this.mapService.getMap()?.flyTo({
      center: [-51.9253, -14.235],
      zoom: 3.5,
    });

    this.mapService.selectedCityStations.set([]);
  }

  onFocus(): void {
    this.selected.set(null);
  }

  onKeydown(event: KeyboardEvent): void {
    const list = this.results();
    if (!this.isOpen() || list.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, list.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex() >= 0) this.select(list[this.activeIndex()]);
        break;
      case 'Escape':
        this.selected.set('__close__');
        break;
    }
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    if (!target) return;
    if (!this.elRef.nativeElement.contains(target as Node)) {
      this.selected.set('__close__');
    }
  }
}
