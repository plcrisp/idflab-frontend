import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { VerifyEmail } from './components/verify-email/verify-email';

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
    path: 'verify-email',
    component: VerifyEmail,
    title: 'Registrar | IDFLab',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
