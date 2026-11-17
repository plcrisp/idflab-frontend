import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/utils/token.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { BehaviorSubject, throwError, catchError, switchMap, filter, take } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken = tokenService.getAccessToken();

  // ignore requests to the refresh endpoint to prevent infinite loop
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  let authReq = req;
  if (accessToken) {
    authReq = tokenService.addTokenHeader(req, accessToken);
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && accessToken) {
        if (!isRefreshing) {
          const refreshToken = tokenService.getRefreshToken();
          if (!refreshToken) {
            tokenService.clearTokens();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }

          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken(refreshToken).pipe(
            switchMap((response: any) => {
              isRefreshing = false;

              tokenService.saveTokens(response.access_token, response.refresh_token);

              refreshTokenSubject.next(response.access_token);

              return next(tokenService.addTokenHeader(req, response.access_token));
            }),
            catchError((err) => {
              isRefreshing = false;
              refreshTokenSubject.next('');
              tokenService.clearTokens();
              router.navigate(['/auth/login']);
              return throwError(() => err);
            }),
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((jwt) => {
              if (!jwt) {
                return throwError(() => error);
              }
              return next(tokenService.addTokenHeader(req, jwt));
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
