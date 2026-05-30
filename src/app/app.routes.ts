import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/matches',
    loadComponent: () => import('./features/admin/admin-matches/admin-matches.component').then(m => m.AdminMatchesComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/results',
    loadComponent: () => import('./features/admin/admin-results/admin-results.component').then(m => m.AdminResultsComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
