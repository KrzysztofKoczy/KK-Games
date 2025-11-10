import { Component, OnInit, signal, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonBadge
} from '@ionic/angular/standalone';
import { addCircleOutline, enterOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { SocketService } from '../../../core/socket/socket.service';
import { extractGameTypeFromRoomId } from '../../utils/game-utils';

interface OpenLobby {
  roomId: string;
  gameType: string;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-game-lobby',
  standalone: true,
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
    IonToast,
    IonBadge
  ],
  templateUrl: './game-lobby.html',
  styleUrls: ['./game-lobby.scss']
})
export class GameLobby implements OnInit, OnDestroy {
  @Input() gameType: string = 'pictionary'; // Typ gry (spy, pictionary, etc.)

  readonly openLobbies = signal<OpenLobby[]>([]);
  readonly showToast = signal(false);
  readonly toastMessage = signal('');

  private gameCreatedHandler?: (data: any) => void;
  private playerJoinedHandler?: (data: any) => void;
  private errorHandler?: (error: any) => void;
  private openLobbiesHandler?: (data: any) => void;
  private lobbyUpdatedHandler?: (data: any) => void;

  constructor(
    private socketService: SocketService,
    private router: Router
  ) {
    addIcons({ addCircleOutline, enterOutline });
  }

  ngOnInit(): void {
    // Obsługa utworzenia gry
    this.gameCreatedHandler = (data) => {
      this.toastMessage.set(`✅ Gra utworzona! Kod: ${data.roomId}`);
      this.showToast.set(true);
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    };

    // Obsługa dołączenia do gry
    this.playerJoinedHandler = (data) => {
      this.toastMessage.set(`✅ Dołączono do gry!`);
      this.showToast.set(true);
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    };

    // Obsługa błędów
    this.errorHandler = (error) => {
      this.toastMessage.set(`❌ ${error.message || 'Wystąpił błąd'}`);
      this.showToast.set(true);
    };

    // Obsługa listy otwartych lobby
    this.openLobbiesHandler = (data) => {
      if (data.gameType === this.gameType) {
        this.openLobbies.set(data.lobbies || []);
      }
    };

    // Obsługa aktualizacji lobby
    this.lobbyUpdatedHandler = (data) => {
      if (data.gameType === this.gameType) {
        // Odśwież listę lobby
        this.loadOpenLobbies();
      }
    };

    this.socketService.on('game-created', this.gameCreatedHandler);
    this.socketService.on('player-joined', this.playerJoinedHandler);
    this.socketService.on('error', this.errorHandler);
    this.socketService.on('open-lobbies-list', this.openLobbiesHandler);
    this.socketService.on('lobby-updated', this.lobbyUpdatedHandler);

    // Załaduj listę otwartych lobby
    this.loadOpenLobbies();
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
    if (this.openLobbiesHandler) {
      this.socketService.off('open-lobbies-list', this.openLobbiesHandler);
    }
    if (this.lobbyUpdatedHandler) {
      this.socketService.off('lobby-updated', this.lobbyUpdatedHandler);
    }
  }

  loadOpenLobbies(): void {
    this.socketService.emit('get-open-lobbies', { gameType: this.gameType });
  }

  createGame(): void {
    this.socketService.createGame(this.gameType, 12);
  }

  joinLobby(roomId: string): void {
    this.socketService.joinGame(roomId);
  }

  private navigateToGame(roomId: string, gameType?: string): void {
    const type = gameType || extractGameTypeFromRoomId(roomId) || this.gameType;
    this.router.navigate([`/${type}`, 'game', roomId]);
  }
}
