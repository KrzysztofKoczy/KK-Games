import { Injectable, signal, inject } from '@angular/core';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BaseSocketHandlerService } from '../../../shared/services/base-socket-handler.service';
import {
  Player,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  GameCreatedEvent,
  SpyConfiguredEvent,
  SpyGameStartedEvent,
  SpyGameEndedEvent,
  SpyGameResetEvent,
  ErrorEvent
} from '../../../core/socket/socket-events.types';

export type GamePhase = 'waiting' | 'configuring' | 'playing' | 'finished';
export type PlayerCard = 'spy' | 'location' | null;

@Injectable()
export class SpyGameService extends BaseSocketHandlerService {
  private readonly guestAuth = inject(GuestAuthService);
  private readonly toastService = inject(ToastService);

  readonly players = signal<Player[]>([]);
  readonly currentPlayerToken = signal<string>('');
  readonly creatorToken = signal<string>('');
  readonly isGameMaster = signal<boolean>(false);
  readonly gamePhase = signal<GamePhase>('waiting');
  readonly spyCount = signal<number>(1);
  readonly playerCard = signal<PlayerCard>(null);
  readonly location = signal<string | null>(null);
  readonly participants = signal<Player[]>([]);
  readonly cardFlipped = signal(false);
  readonly isConfiguring = signal<boolean>(false);
  readonly isStarting = signal<boolean>(false);
  readonly isEnding = signal<boolean>(false);
  readonly isResetting = signal<boolean>(false);

  private roomId: string = '';

  /**
   * Inicjalizuje serwis dla danej gry
   */
  initialize(roomId: string): void {
    const token = this.guestAuth.getGuestToken();

    this.roomId = roomId;
    this.currentPlayerToken.set(token || '');
    this.setupSocketHandlers();
    
    // Początkowo ustaw uczestników na podstawie obecnych graczy
    setTimeout(() => {
      this.updateGameMasterStatus();
      this.updateParticipants();
    }, 100);
  }

  /**
   * Konfiguruje handlery socketów
   */
  private setupSocketHandlers(): void {
    this.registerListener('game-created', (data: GameCreatedEvent) => {
      if (data.creator) {
        this.creatorToken.set(data.creator);
      }
      this.updateGameMasterStatus();
    });

    this.registerListener('player-joined', (data: PlayerJoinedEvent) => {
      if (data.creator) {
        this.creatorToken.set(data.creator);
      }
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.toastService.info(`${data.player.name} dołączył do gry!`);
    });

    this.registerListener('player-left', (data: PlayerLeftEvent) => {
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.toastService.warning('Gracz opuścił grę');
    });

    this.registerListener('spy-configured', (data: SpyConfiguredEvent) => {
      this.isConfiguring.set(false);
      this.spyCount.set(data.spyCount);
      this.participants.set(data.participants || []);
      this.gamePhase.set('configuring');
      this.toastService.success(`Konfiguracja zapisana: ${data.spyCount} szpiegów`);
    });

    this.registerListener('spy-game-started', (data: SpyGameStartedEvent) => {
      this.isStarting.set(false);
      this.playerCard.set(data.playerCard);
      this.location.set(data.location);
      this.participants.set(data.participants || []);
      this.gamePhase.set('playing');
      this.cardFlipped.set(false);
      this.toastService.success('Gra rozpoczęta!');
    });

    this.registerListener('spy-game-ended', (data: SpyGameEndedEvent) => {
      this.isEnding.set(false);
      this.gamePhase.set('finished');
      this.toastService.info('Gra zakończona!');
    });

    this.registerListener('spy-game-reset', (data: SpyGameResetEvent) => {
      this.isResetting.set(false);
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.gamePhase.set('waiting');
      this.playerCard.set(null);
      this.location.set(null);
      this.cardFlipped.set(false);
      this.toastService.success('Nowa gra przygotowana!');
    });

    this.registerListener('error', (error: ErrorEvent) => {
      this.isConfiguring.set(false);
      this.isStarting.set(false);
      this.isEnding.set(false);
      this.isResetting.set(false);
      this.toastService.error(error.message || 'Wystąpił błąd');
    });
  }

  private updateGameMasterStatus(): void {
    const creator = this.creatorToken();

    if (creator) {
      this.isGameMaster.set(creator === this.currentPlayerToken());
    } else {
      const allPlayers = this.players();

      if (allPlayers.length > 0) {
        const firstPlayer = allPlayers[0];

        this.isGameMaster.set(firstPlayer?.token === this.currentPlayerToken());
      } else {
        this.isGameMaster.set(false);
      }
    }
  }

  private updateParticipants(): void {
    const allPlayers = this.players();

    if (allPlayers.length > 1) {
      this.participants.set(allPlayers.slice(1));
    } else {
      this.participants.set([]);
    }
  }

  configureSpyCount(spyCount: number, participantsCount: number): boolean {
    this.isConfiguring.set(true);
    this.socketService.emit('spy-configure', {
      roomId: this.roomId,
      spyCount: spyCount
    });
    
    // Reset loading state po 5 sekundach (timeout)
    setTimeout(() => {
      this.isConfiguring.set(false);
    }, 5000);
    
    return true;
  }

  startGame(playersCount: number, spyCount: number): boolean {
    if (playersCount < 5) {
      this.toastService.error('Minimum 4 uczestników + mistrz gry (łącznie 5 osób)');

      return false;
    }

    if (!spyCount) {
      this.toastService.error('Najpierw ustaw liczbę szpiegów');

      return false;
    }

    this.isStarting.set(true);
    this.socketService.emit('spy-start-game', {
      roomId: this.roomId
    });
    
    // Reset loading state po 5 sekundach (timeout)
    setTimeout(() => {
      this.isStarting.set(false);
    }, 5000);
    
    return true;
  }

  endGame(): void {
    this.isEnding.set(true);
    this.socketService.emit('spy-end-game', {
      roomId: this.roomId
    });
    
    // Reset loading state po 3 sekundach (timeout)
    setTimeout(() => {
      this.isEnding.set(false);
    }, 3000);
  }

  newGame(): void {
    this.isResetting.set(true);
    this.socketService.emit('spy-new-game', {
      roomId: this.roomId
    });
    
    // Reset loading state po 3 sekundach (timeout)
    setTimeout(() => {
      this.isResetting.set(false);
    }, 3000);
  }

  flipCard(): void {
    this.cardFlipped.set(true);
  }
}

