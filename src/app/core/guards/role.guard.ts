import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/profile.interface';

/**
 * Dynamic functional Role Guard.
 * Restricts route activation to specific database roles (e.g., 'admin', 'user').
 * 
 * @param allowedRoles Array of roles permitted to view this route.
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Wait until initial session resolution is complete
    await authService.initialized();

    // 2. Resolve database profile
    const profile = authService.profile();

    if (profile && allowedRoles.includes(profile.role)) {
      return true;
    }

    // 3. Reject and redirect to general dashboard
    console.warn(`Access denied. Role "${profile?.role}" is not authorized for this route.`);
    return router.createUrlTree(['/dashboard']);
  };
};
