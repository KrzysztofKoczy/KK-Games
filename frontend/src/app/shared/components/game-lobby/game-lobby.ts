import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge
} from '@ionic/angular/standalone';
import { addCircleOutline, enterOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GameLobbyService } from '../../services/game-lobby.service';
import { SocketService } from '../../../core/socket/socket.service';

@Component({
  selector: 'app-game-lobby',
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge
  ],
  templateUrl: './game-lobby.html',
  styleUrls: ['./game-lobby.scss'],
  providers: [GameLobbyService],
  host: {
    'class': 'ion-page'
  }
})
export class GameLobby implements OnInit, OnDestroy {
  @Input() gameType: string = 'pictionary'; // Typ gry (spy, pictionary, etc.)

  private readonly lobbyService = inject(GameLobbyService);

  readonly openLobbies = this.lobbyService.openLobbies;
  readonly isLoadingLobbies = this.lobbyService.isLoadingLobbies;
  readonly isCreatingGame = inject(SocketService).isCreatingGame;
  readonly isJoiningGame = inject(SocketService).isJoiningGame;

  constructor() {
    addIcons({ addCircleOutline, enterOutline });
  }

  ngOnInit(): void {
    this.lobbyService.initialize(this.gameType);
  }

  ngOnDestroy(): void {
    this.lobbyService.cleanup();
  }

  loadOpenLobbies(): void {
    this.lobbyService.loadOpenLobbies();
  }

  createGame(): void {
    this.lobbyService.createGame(12);
  }

  joinLobby(roomId: string): void {
    this.lobbyService.joinLobby(roomId);
  }
}
