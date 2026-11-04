import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { projectAccessGuard } from './core/guards/project-access.guard';
import { initialRouteGuard } from './core/guards/initial-route.guard';
import { NotFound } from './shared/components/not-found/not-found';

const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth-module').then((m) => m.AuthModule),
  },
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [initialRouteGuard],
        children: [],
      },

      { path: 'dashboard', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'projetos', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'perfil', redirectTo: 'profile', pathMatch: 'full' },

      {
        path: 'projects',
        loadChildren: () =>
          import('./features/dashboard/dashboard-module').then((m) => m.DashboardModule),
      },

      {
        path: 'interactive-map',
        loadChildren: () =>
          import('./features/interactive-map/interactive-map-module').then(
            (m) => m.InteractiveMapModule,
          ),
      },

      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile-module').then((m) => m.ProfileModule),
      },

      {
        path: 'analysis/:projectId',
        canActivate: [projectAccessGuard],
        loadChildren: () =>
          import('./features/analysis/analysis-module').then((m) => m.AnalysisModule),
      },

      { path: '**', component: NotFound, title: 'Página Não Encontrada | IDFLab' },
    ],
  },
  { path: '', redirectTo: 'app', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
