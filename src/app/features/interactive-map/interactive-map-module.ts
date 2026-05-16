import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { INTERACTIVE_MAP_ROUTES } from './interactive-map.routes';
import { InteractiveMap } from './pages/interactive-map/interactive-map';
import { NgIconsModule } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';

@NgModule({
  declarations: [InteractiveMap],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(INTERACTIVE_MAP_ROUTES),
    SharedModule,
    NgIconsModule.withIcons({
      lucideSearch,
    }),
  ],
})
export class InteractiveMapModule {}
