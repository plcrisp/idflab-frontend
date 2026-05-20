import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { INTERACTIVE_MAP_ROUTES } from './interactive-map.routes';
import { InteractiveMap } from './pages/interactive-map/interactive-map';
import { NgIconsModule } from '@ng-icons/core';
import { lucideMapPin, lucideSearch, lucideX } from '@ng-icons/lucide';
import { MapFloatingPanel } from './components/map-floating-panel/map-floating-panel';
import { StationAnalytics } from './components/station-analytics/station-analytics';
import { StationList } from './components/station-list/station-list';
import { SelectStation } from './components/select-station/select-station';
import { StationSearch } from './components/station-search/station-search';

@NgModule({
  declarations: [
    InteractiveMap,
    MapFloatingPanel,
    StationAnalytics,
    StationList,
    SelectStation,
    StationSearch,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(INTERACTIVE_MAP_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({
      lucideSearch,
      lucideX,
      lucideMapPin,
    }),
  ],
})
export class InteractiveMapModule {}
