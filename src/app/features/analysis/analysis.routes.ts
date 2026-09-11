import { Routes } from '@angular/router';
import { InitialVisualization } from './pages/initial-visualization/initial-visualization';
import { AnalysisLayout } from './analysis-layout/analysis-layout';
import { ConsistencyCheck } from './pages/consistency-check/consistency-check';

export const ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisLayout,
    title: 'Análise | IDFLab',
    children: [
      { path: '', redirectTo: 'initial-view', pathMatch: 'full' },
      { path: 'initial-view', component: InitialVisualization, title: 'Visualização Inicial | IDFLab' },
      { path: 'consistency-check', component: ConsistencyCheck, title: 'Verificação de Consistência | IDFLab' },
    ],
  },
];
