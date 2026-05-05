import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { TokenService } from '../../../core/services/token.service';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  constructor(
    private ngZone: NgZone,
    private auth: AuthService,
    private router: Router,
    private tokenService: TokenService,
  ) {}

  initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve) => {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          this.ngZone.run(() => this.onGoogleLoginSuccess(response));
        },
      });
      resolve();
    });
  }

  openPopup(): void {
    google.accounts.oauth2
      .initTokenClient({
        client_id: environment.googleClientId,
        scope: 'openid email profile',
        callback: (tokenResponse: any) => {
          this.ngZone.run(() => this.onGoogleLoginSuccess(tokenResponse));
        },
      })
      .requestAccessToken({ prompt: 'select_account' });
  }

  private onGoogleLoginSuccess(googleToken: any) {
    this.auth.loginWithGoogle(googleToken.access_token).subscribe({
      next: (response) => {
        if (response.needs_registration) {
          this.router.navigate(['/auth/register'], {
            state: { isGoogleAuth: true, email: response.email, name: response.name },
          });
        } else {
          this.tokenService.saveTokens(response.access_token, response.refresh_token);
          this.router.navigate(['/app']);
          console.log('Login com Google realizado com sucesso!');
        }
      },
      error: (err) => console.error('Erro no login com Google', err),
    });
  }
}
