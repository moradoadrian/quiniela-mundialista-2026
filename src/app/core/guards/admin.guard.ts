import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Wait until initial session resolution is complete
  await authService.initialized();

  // 2. Evaluate administrative privileges
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // 3. Fall back to main dashboard
  return router.createUrlTree(['/dashboard']);
};
