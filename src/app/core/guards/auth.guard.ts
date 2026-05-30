import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Wait until the AuthService finishes initial session resolution
  // (such as reading localStorage or parsing tokens from OAuth hash fragment)
  await authService.initialized();

  // 2. Evaluate session state
  if (authService.isAuthenticated()) {
    return true;
  }

  // 3. Reject and route back to login
  return router.createUrlTree(['/auth']);
};
