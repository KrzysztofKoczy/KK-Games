import { Component } from '@angular/core';
import { GameLobby } from '../../../shared/components/game-lobby/game-lobby';

@Component({
  selector: 'app-spy-lobby',
  standalone: true,
  imports: [GameLobby],
  template: `
    <app-game-lobby [gameType]="'spy'"/>
  `
})
export class SpyLobby {
}
