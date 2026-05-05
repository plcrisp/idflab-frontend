import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';

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
    children: [],
  },
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
