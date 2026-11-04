import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/services/utils/token.service';
import { Router } from '@angular/router';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  constructor(
    private auth: AuthService,
    private tokenService: TokenService,
    private ngZone: NgZone,
    private router: Router,
  ) {}

  initializeGoogleAuth(): void {
    if (typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.onGoogleLoginSuccess(response),
    });
  }

  openPopup(route?: string): void {
    google.accounts.oauth2
      .initTokenClient({
        client_id: environment.googleClientId,
        scope: 'openid email profile',
        callback: (tokenResponse: any) => {
          this.ngZone.run(() => this.onGoogleLoginSuccess(tokenResponse, route));
        },
      })
      .requestAccessToken({ prompt: 'select_account' });
  }

  private onGoogleLoginSuccess(googleToken: any, route?: string) {
    this.auth.loginWithGoogle(googleToken.access_token).subscribe({
      next: (response) => {
        if (response.needs_registration) {
          this.router.navigate(['/auth/register'], {
            state: { isGoogleAuth: true, email: response.email, name: response.name },
          });
        } else {
          this.tokenService.saveTokens(response.access_token, response.refresh_token);
          this.auth.navigateAfterLogin(route);
          console.log('Login com Google realizado com sucesso!');
        }
      },
      error: (err) => console.error('Erro no login com Google', err),
    });
  }
}
