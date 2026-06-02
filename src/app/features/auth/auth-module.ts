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
import { SharedModule } from '../../shared/shared-module';
import { lucideBan, lucideLock, lucideMail } from '@ng-icons/lucide';
import { NgIcon, NgIconsModule, provideIcons } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

@NgModule({
  declarations: [Login, Register, VerifyEmail, ForgotPassword, ResetPassword],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(AUTH_ROUTES),
    SharedModule,
    NgIcon,
    NgIconsModule.withIcons({
      lucideBan,
      lucideMail,
      lucideLock,
    }),
    ...HlmButtonImports,
    ...HlmLabelImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmInputGroupImports,
    ...HlmSpinnerImports,
  ],
})
export class AuthModule {}
