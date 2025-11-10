import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { ToastService } from './toast.service';
import { extractGameTypeFromRoomId } from '../utils/game-utils';
import {
  GameCreatedEvent,
  PlayerJoinedEvent,
  ErrorEvent,
  OpenLobbiesListEvent,
  LobbyUpdatedEvent,
  OpenLobby
} from '../../core/socket/socket-events.types';

@Injectable({
  providedIn: 'root'
})
export class GameLobbyService {
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly openLobbies = signal<OpenLobby[]>([]);
  readonly isLoadingLobbies = signal<boolean>(false);

  private unsubscribeFunctions: (() => void)[] = [];
  private gameType: string = '';

  /**
   * Inicjalizuje serwis dla danego typu gry
   */
  initialize(gameType: string): void {
    this.gameType = gameType;
    this.setupSocketHandlers();
    this.loadOpenLobbies();
  }

  /**
   * Czyści wszystkie listenery
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  /**
   * Konfiguruje handlery socketów
   */
  private setupSocketHandlers(): void {
    const gameCreatedHandler = (data: GameCreatedEvent) => {
      this.socketService.isCreatingGame.set(false);
      this.toastService.success(`Gra utworzona! Kod: ${data.roomId}`);
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    };

    const playerJoinedHandler = (data: PlayerJoinedEvent) => {
      this.socketService.isJoiningGame.set(false);
      this.toastService.success('Dołączono do gry!');
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    };

    const errorHandler = (error: ErrorEvent) => {
      this.socketService.isCreatingGame.set(false);
      this.socketService.isJoiningGame.set(false);
      this.toastService.error(error.message || 'Wystąpił błąd');
    };

    const openLobbiesHandler = (data: OpenLobbiesListEvent) => {
      if (data.gameType === this.gameType) {
        this.openLobbies.set(data.lobbies || []);
        this.isLoadingLobbies.set(false);
      }
    };

    const lobbyUpdatedHandler = (data: LobbyUpdatedEvent) => {
      if (data.gameType === this.gameType) {
        // Odśwież listę lobby
        this.loadOpenLobbies();
      }
    };

    // Rejestruj handlery
    this.unsubscribeFunctions.push(
      this.socketService.on('game-created', gameCreatedHandler),
      this.socketService.on('player-joined', playerJoinedHandler),
      this.socketService.on('error', errorHandler),
      this.socketService.on('open-lobbies-list', openLobbiesHandler),
      this.socketService.on('lobby-updated', lobbyUpdatedHandler)
    );
  }

  /**
   * Ładuje listę otwartych lobby
   */
  loadOpenLobbies(): void {
    this.isLoadingLobbies.set(true);
    this.socketService.emit('get-open-lobbies', { gameType: this.gameType });
    
    // Reset loading state po 3 sekundach (timeout)
    setTimeout(() => {
      this.isLoadingLobbies.set(false);
    }, 3000);
  }

  /**
   * Tworzy nową grę
   */
  createGame(maxPlayers: number = 12): void {
    this.socketService.createGame(this.gameType, maxPlayers);
  }

  /**
   * Dołącza do lobby
   */
  joinLobby(roomId: string): void {
    this.socketService.joinGame(roomId);
  }

  /**
   * Nawiguje do gry
   */
  private navigateToGame(roomId: string, gameType?: string): void {
    const type = gameType || extractGameTypeFromRoomId(roomId) || this.gameType;
    this.router.navigate([`/${type}`, 'game', roomId]);
  }
}

