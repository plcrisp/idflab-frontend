import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: Login,
    title: 'Entrar | IDFLab',
  },
  {
    path: 'register',
    component: Register,
    title: 'Registrar | IDFLab',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
