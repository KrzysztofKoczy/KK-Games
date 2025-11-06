import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pictionary-lobby/pictionary-lobby').then(m => m.PictionaryLobby)
  },
  {
    path: 'game/:roomId',
    loadComponent: () => import('./pictionary-game/pictionary-game').then(m => m.PictionaryGame)
  }
];
