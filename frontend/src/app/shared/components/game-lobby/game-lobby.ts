import { Component, OnInit, signal, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { addCircleOutline, enterOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';
import { GameOption, AVAILABLE_GAMES } from '../../constants/game-types';

export type { GameOption };

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon,
    IonToast,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './game-lobby.html',
  styleUrls: ['./game-lobby.scss']
})
export class GameLobby implements OnInit, OnDestroy {
  @Input() defaultGame: string = 'pictionary';
  @Input() availableGames: GameOption[] = AVAILABLE_GAMES;
  @Input() gameRoutePrefix: string = '/pictionary';

  roomCode = '';
  selectedGame = '';
  readonly showToast = signal(false);
  readonly toastMessage = signal('');

  private gameCreatedHandler?: (data: any) => void;
  private playerJoinedHandler?: (data: any) => void;
  private errorHandler?: (error: any) => void;

  constructor(
    private socketService: SocketService,
    private guestAuth: GuestAuthService,
    private router: Router
  ) {
    addIcons({ addCircleOutline, enterOutline });
  }

  ngOnInit(): void {
    this.selectedGame = this.defaultGame;
    this.updateRoutePrefix();

    // Obsługa utworzenia gry
    this.gameCreatedHandler = (data) => {
      this.toastMessage.set(`✅ Gra utworzona! Kod: ${data.roomId}`);
      this.showToast.set(true);
      setTimeout(() => {
        this.navigateToGame(data.roomId);
      }, 1000);
    };

    // Obsługa dołączenia do gry
    this.playerJoinedHandler = (data) => {
      this.toastMessage.set(`✅ Dołączono do gry!`);
      this.showToast.set(true);
      setTimeout(() => {
        this.navigateToGame(data.roomId);
      }, 1000);
    };

    // Obsługa błędów
    this.errorHandler = (error) => {
      this.toastMessage.set(`❌ ${error.message || 'Wystąpił błąd'}`);
      this.showToast.set(true);
    };

    this.socketService.on('game-created', this.gameCreatedHandler);
    this.socketService.on('player-joined', this.playerJoinedHandler);
    this.socketService.on('error', this.errorHandler);
  }

  ngOnDestroy(): void {
    if (this.gameCreatedHandler) {
      this.socketService.off('game-created', this.gameCreatedHandler);
    }
    if (this.playerJoinedHandler) {
      this.socketService.off('player-joined', this.playerJoinedHandler);
    }
    if (this.errorHandler) {
      this.socketService.off('error', this.errorHandler);
    }
  }

  onGameChange(): void {
    this.updateRoutePrefix();
  }

  private updateRoutePrefix(): void {
    this.gameRoutePrefix = `/${this.selectedGame}`;
  }

  createGame(): void {
    console.log('createGame', this.selectedGame);
    this.socketService.createGame(this.selectedGame, 12);
  }

  joinGame(): void {
    if (!this.roomCode.trim()) {
      this.toastMessage.set('❌ Wprowadź kod gry');
      this.showToast.set(true);
      return;
    }

    this.socketService.joinGame(this.roomCode.trim());
  }

  private navigateToGame(roomId: string): void {
    this.router.navigate([this.gameRoutePrefix, 'game', roomId]);
  }
}

