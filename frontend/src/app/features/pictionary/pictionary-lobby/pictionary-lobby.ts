import { Component } from '@angular/core';
import { GameLobby } from '../../../shared/components/game-lobby/game-lobby';

@Component({
  selector: 'app-pictionary-lobby',
  standalone: true,
  imports: [GameLobby],
  template: `
    <app-game-lobby
      [gameType]="'pictionary'"
    ></app-game-lobby>
  `
})
export class PictionaryLobby {
}
