import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { ToastService } from './toast.service';
import { BaseSocketHandlerService } from './base-socket-handler.service';
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
export class GameLobbyService extends BaseSocketHandlerService {
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly openLobbies = signal<OpenLobby[]>([]);
  readonly isLoadingLobbies = signal<boolean>(false);

  private gameType: string = '';

  initialize(gameType: string): void {
    this.gameType = gameType;
    this.setupSocketHandlers();
    this.loadOpenLobbies();
  }

  /**
   * Konfiguruje handlery socketów
   */
  private setupSocketHandlers(): void {
    this.registerListener('game-created', (data: GameCreatedEvent) => {
      this.socketService.isCreatingGame.set(false);
      this.toastService.success(`Gra utworzona! Kod: ${data.roomId}`);
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    });

    this.registerListener('player-joined', (data: PlayerJoinedEvent) => {
      this.socketService.isJoiningGame.set(false);
      this.toastService.success('Dołączono do gry!');
      const detectedGameType = data.gameType || extractGameTypeFromRoomId(data.roomId) || this.gameType;
      setTimeout(() => {
        this.navigateToGame(data.roomId, detectedGameType);
      }, 1000);
    });

    this.registerListener('error', (error: ErrorEvent) => {
      this.socketService.isCreatingGame.set(false);
      this.socketService.isJoiningGame.set(false);
      this.toastService.error(error.message || 'Wystąpił błąd');
    });

    this.registerListener('open-lobbies-list', (data: OpenLobbiesListEvent) => {
      if (data.gameType === this.gameType) {
        this.openLobbies.set(data.lobbies || []);
        this.isLoadingLobbies.set(false);
      }
    });

    this.registerListener('lobby-updated', (data: LobbyUpdatedEvent) => {
      if (data.gameType === this.gameType) {
        this.loadOpenLobbies();
      }
    });
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

