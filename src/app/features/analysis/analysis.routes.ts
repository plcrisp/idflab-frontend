import { Routes } from '@angular/router';
import { InitialVisualization } from './pages/initial-visualization/initial-visualization';
import { AnalysisLayout } from './analysis-layout/analysis-layout';
import { ConsistencyCheck } from './pages/consistency-check/consistency-check';
import { GapFilling } from './pages/gap-filling/gap-filling';
import { projectAccessGuard } from '../../core/guards/project-access.guard';

export const ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisLayout,
    canActivateChild: [projectAccessGuard],
    title: 'Análise | IDFLab',
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [projectAccessGuard],
        component: InitialVisualization,
      },
      {
        path: 'initial-view',
        component: InitialVisualization,
        title: 'Visualização Inicial | IDFLab',
      },
      {
        path: 'initial-visualization',
        redirectTo: 'initial-view',
        pathMatch: 'full',
      },
      {
        path: 'consistency-check',
        component: ConsistencyCheck,
        title: 'Verificação de Consistência | IDFLab',
      },
      {
        path: 'tratamento-de-falhas',
        component: GapFilling,
        title: 'Tratamento de Falhas | IDFLab',
      },
      {
        path: 'gap-filling',
        redirectTo: 'tratamento-de-falhas',
        pathMatch: 'full',
      },
    ],
  },
];

