import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { TokenService } from './token.service';
import { TokenResponse } from '../models/token.model';
import { User } from '../models/user.model';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.auth}`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
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
        }),
      );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }

  refreshToken(refreshToken: string) {
    return this.http.post(`${this.baseUrl}/refresh`, {
      refresh_token: refreshToken,
    });
  }

  logout(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();

    const body = refreshToken ? { refresh_token: refreshToken } : {};

    return this.http.post(`${this.baseUrl}/logout`, body).pipe(
      tap(() => {
        this.tokenService.clearTokens();
      }),
    );
  }
}
