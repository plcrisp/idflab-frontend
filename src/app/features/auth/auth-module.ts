import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { Login } from './components/login/login';
import { AUTH_ROUTES } from './auth.routes';
import { Register } from './components/register/register';
import { VerifyEmail } from './components/verify-email/verify-email';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';

@NgModule({
  declarations: [Login, Register, VerifyEmail, ForgotPassword, ResetPassword],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(AUTH_ROUTES)],
})
export class AuthModule {}
