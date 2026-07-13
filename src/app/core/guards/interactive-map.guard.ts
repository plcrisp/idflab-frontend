import { CanDeactivateFn } from '@angular/router';
import { MapService } from '../services/utils/map.service';
import { inject } from '@angular/core';

export const resetMapSelectionGuard: CanDeactivateFn<unknown> = () => {
  const mapService = inject(MapService);
  mapService.resetAll();
  return true;
};
