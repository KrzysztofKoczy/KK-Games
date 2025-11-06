import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home-page').then(m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page').then(m => m.LoginPage)
  },
  {
    path: 'pictionary',
    loadChildren: () => import('./features/pictionary/pictionary.routes').then(m => m.routes)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

