import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.routes').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.routes').then(m => m.routes)
  },
  {
    path: 'pictionary',
    loadChildren: () => import('./features/pictionary/pictionary.routes').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'spy',
    loadChildren: () => import('./features/spy/spy.routes').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

