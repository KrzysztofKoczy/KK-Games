import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./spy-lobby/spy-lobby').then(m => m.SpyLobby)
    },
    {
        path: 'game/:roomId',
        loadComponent: () => import('./spy-game/spy-game').then(m => m.SpyGame)
    }
]