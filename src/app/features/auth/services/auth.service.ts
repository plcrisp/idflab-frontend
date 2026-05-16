import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { TokenService } from '../../../core/services/utils/token.service';
import { TokenResponse } from '../../../core/models/utils/token.model';
import {
  GoogleRegisterRequest,
  ResetPasswordPayload,
  User,
  UserRegistration,
} from '../models/user.model';

import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.auth}`;

  private userSignal = signal<User | null>(null);

  user = computed(() => this.userSignal());

  userInitials = computed(() => {
    const name = this.userSignal()?.name;
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length >= 2
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  });

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.tokenService.saveTokens(response.access_token, response.refresh_token);
          this.router.navigate(['/app']);
        }),
      );
  }

  register(user: UserRegistration): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/register`, user);
  }

  loginWithGoogle(googleToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/google`, { token: googleToken });
  }

  registerWithGoogle(data: GoogleRegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/google/register`, data);
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/me`)
      .pipe(tap((userData) => this.userSignal.set(userData)));
  }

  refreshToken(refreshToken: string) {
    return this.http.post(`${this.baseUrl}/refresh`, {
      refresh_token: refreshToken,
    });
  }

  logout(): Observable<any> {
    this.userSignal.set(null);

    const refreshToken = this.tokenService.getRefreshToken();

    const body = refreshToken ? { refresh_token: refreshToken } : {};

    return this.http.post(`${this.baseUrl}/logout`, body).pipe(
      tap(() => {
        this.tokenService.clearTokens();
        this.router.navigate(['/auth/login']);
      }),
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/verify-email?token=${token}`);
  }

  resendEmailVerification(user_email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-verification-email`, { email: user_email });
  }

  resetPassword(resetPasswordPayload: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, resetPasswordPayload);
  }

  sendPasswordReset(user_email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-password-reset-email`, { email: user_email });
  }
}
