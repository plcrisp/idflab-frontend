import { Routes } from '@angular/router';
import { InteractiveMap } from './pages/interactive-map/interactive-map';

export const ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'interactive-map',
    pathMatch: 'full',
  },
  {
    path: 'interactive-map',
    component: InteractiveMap,
    title: 'Mapa Interativo | IDFLab',
  },
];
