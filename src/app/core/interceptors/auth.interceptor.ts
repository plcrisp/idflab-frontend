import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../../features/auth/services/token.service';
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
      // Se retornar 401 e já tínhamos um token (ele expirou)
      if (error instanceof HttpErrorResponse && error.status === 401 && accessToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null); // Reseta o subject

          const refreshToken = tokenService.getRefreshToken();

          if (refreshToken) {
            // Chama a rota do FastAPI para renovar o token
            return authService.refreshToken(refreshToken).pipe(
              switchMap((response: any) => {
                isRefreshing = false;

                // Salva os novos tokens que vieram do backend
                tokenService.saveTokens(response.access_token, response.refresh_token);

                // Avisa as outras requisições que estavam na fila que o token chegou
                refreshTokenSubject.next(response.access_token);

                // Refaz a requisição original que falhou com 401
                return next(tokenService.addTokenHeader(req, response.access_token));
              }),
              catchError((err) => {
                // Se o refresh token também falhar/expirar, desloga o usuário
                isRefreshing = false;
                tokenService.clearTokens();
                // Aqui você pode adicionar um router.navigate(['/login'])
                return throwError(() => err);
              }),
            );
          }
        } else {
          // Se já está atualizando o token, as próximas requisições 401 caem aqui
          // Elas ficam "escutando" o refreshTokenSubject até ele ter um valor (o novo token)
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1), // Pega só o primeiro valor emitido
            switchMap((jwt) => {
              return next(tokenService.addTokenHeader(req, jwt));
            }),
          );
        }
      }

      // Se for outro erro, só repassa
      return throwError(() => error);
    }),
  );
};
