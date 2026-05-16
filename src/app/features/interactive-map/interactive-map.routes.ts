import { Routes } from '@angular/router';
import { InteractiveMap } from './pages/interactive-map/interactive-map';

export const INTERACTIVE_MAP_ROUTES: Routes = [
  {
    path: '',
    component: InteractiveMap,
    title: 'Mapa Interativo | IDFLab',
  },
];
