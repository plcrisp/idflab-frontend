import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // with token, can't use auth methods
  if (tokenService.getAccessToken()) {
    router.navigate(['/app']);
    return false;
  }

  // no token
  return true;
};
