import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { BehaviorSubject, throwError, catchError, switchMap, filter, take } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

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
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = tokenService.getRefreshToken();

          if (refreshToken) {
            return authService.refreshToken(refreshToken).pipe(
              switchMap((response: any) => {
                isRefreshing = false;

                tokenService.saveTokens(response.access_token, response.refresh_token);

                refreshTokenSubject.next(response.access_token);

                return next(tokenService.addTokenHeader(req, response.access_token));
              }),
              catchError((err) => {
                isRefreshing = false;
                tokenService.clearTokens();
                return throwError(() => err);
              }),
            );
          }
        } else {
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((jwt) => {
              return next(tokenService.addTokenHeader(req, jwt));
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
