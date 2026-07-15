import { Routes } from '@angular/router';
import { InitialVisualization } from './pages/initial-visualization/initial-visualization';
import { AnalysisLayout } from './analysis-layout/analysis-layout';

export const ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisLayout,
    title: 'Análise | IDFLab',
    children: [
      { path: '', redirectTo: 'initial-view', pathMatch: 'full' },
      { path: 'initial-view', component: InitialVisualization },
    ],
  },
];
