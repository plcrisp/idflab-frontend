import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { VerifyEmail } from './components/verify-email/verify-email';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';

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
    title: 'Verificar Email | IDFLab',
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    title: 'Recuperar Senha | IDFLab',
  },
  {
    path: 'reset-password',
    component: ResetPassword,
    title: 'Alterar Senha | IDFLab',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
