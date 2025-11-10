import { Component } from '@angular/core';
import { GameLobby } from '../../../shared/components/game-lobby/game-lobby';
import { AVAILABLE_GAMES } from '../../../shared/constants/game-types';

@Component({
  selector: 'app-spy-lobby',
  standalone: true,
  imports: [GameLobby],
  template: `
    <app-game-lobby
      [defaultGame]="'spy'"
      [availableGames]="availableGames"
      [gameRoutePrefix]="'/spy'"
    ></app-game-lobby>
  `
})
export class SpyLobby {
  availableGames = AVAILABLE_GAMES;
}
