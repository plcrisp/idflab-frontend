import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service'; // Ajuste o caminho conforme seu projeto

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // with token
  if (tokenService.getAccessToken()) {
    return true;
  }

  // no token
  router.navigate(['/auth/login']);
  return false;
};
