import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonBadge,
  IonToast,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';
import { environment } from '../../../../environments/environment';

interface Player {
  token: string;
  name: string;
}

type GamePhase = 'waiting' | 'configuring' | 'playing' | 'finished';
type PlayerCard = 'spy' | 'location' | null;

@Component({
  selector: 'app-spy-game',
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
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonToast,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './spy-game.html',
  styleUrls: ['./spy-game.scss']
})
export class SpyGame implements OnInit, OnDestroy {
  readonly roomId = signal<string>('');
  readonly players = signal<Player[]>([]);
  readonly currentPlayerToken = signal<string>('');
  readonly isGameMaster = signal<boolean>(false);
  readonly gamePhase = signal<GamePhase>('waiting');
  readonly spyCount = signal<number>(1);
  readonly playerCard = signal<PlayerCard>(null);
  readonly location = signal<string | null>(null);
  readonly participants = signal<Player[]>([]);
  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly cardFlipped = signal(false);

  readonly maxSpyCount = computed(() => {
    return Math.max(1, this.participants().length - 1);
  });

  readonly spyCountOptions = computed(() => {
    const max = this.maxSpyCount();
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  private handlers: Map<string, (data: any) => void> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private guestAuth: GuestAuthService
  ) {}

  ngOnInit(): void {
    const roomIdFromRoute = this.route.snapshot.paramMap.get('roomId');
    if (roomIdFromRoute) {
      this.roomId.set(roomIdFromRoute);
      const token = this.guestAuth.getGuestToken();
      this.currentPlayerToken.set(token || '');

      this.setupSocketHandlers();
      
      // Początkowo ustaw uczestników na podstawie obecnych graczy
      // (jeśli gracz dołącza do istniejącej gry)
      setTimeout(() => {
        this.updateGameMasterStatus();
        this.updateParticipants();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Usuń wszystkie handlery
    this.handlers.forEach((handler, event) => {
      this.socketService.off(event, handler);
    });
    this.handlers.clear();
  }

  private setupSocketHandlers(): void {
    // Handler dla dołączenia gracza
    const playerJoinedHandler = (data: any) => {
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.toastMessage.set(`👥 ${data.player.name} dołączył do gry!`);
      this.showToast.set(true);
      
      // Jeśli to pierwszy gracz (twórca), ustaw jako mistrza
      if (data.players && data.players.length === 1) {
        this.isGameMaster.set(data.players[0].token === this.currentPlayerToken());
      }
    };
    this.socketService.on('player-joined', playerJoinedHandler);
    this.handlers.set('player-joined', playerJoinedHandler);

    // Handler dla opuszczenia gracza
    const playerLeftHandler = (data: any) => {
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.toastMessage.set(`👋 Gracz opuścił grę`);
      this.showToast.set(true);
    };
    this.socketService.on('player-left', playerLeftHandler);
    this.handlers.set('player-left', playerLeftHandler);

    // Handler dla konfiguracji gry
    const spyConfiguredHandler = (data: any) => {
      this.spyCount.set(data.spyCount);
      this.participants.set(data.participants || []);
      this.gamePhase.set('configuring');
      this.toastMessage.set(`✅ Konfiguracja zapisana: ${data.spyCount} szpiegów`);
      this.showToast.set(true);
    };
    this.socketService.on('spy-configured', spyConfiguredHandler);
    this.handlers.set('spy-configured', spyConfiguredHandler);

    // Handler dla startu gry
    const spyGameStartedHandler = (data: any) => {
      this.playerCard.set(data.playerCard);
      this.location.set(data.location);
      this.participants.set(data.participants || []);
      this.gamePhase.set('playing');
      this.cardFlipped.set(false);
      this.toastMessage.set(`🎮 Gra rozpoczęta!`);
      this.showToast.set(true);
    };
    this.socketService.on('spy-game-started', spyGameStartedHandler);
    this.handlers.set('spy-game-started', spyGameStartedHandler);

    // Handler dla zakończenia gry
    const spyGameEndedHandler = (data: any) => {
      this.gamePhase.set('finished');
      this.toastMessage.set(`🏁 Gra zakończona!`);
      this.showToast.set(true);
    };
    this.socketService.on('spy-game-ended', spyGameEndedHandler);
    this.handlers.set('spy-game-ended', spyGameEndedHandler);

    // Handler dla resetu gry
    const spyGameResetHandler = (data: any) => {
      this.players.set(data.players || []);
      this.updateGameMasterStatus();
      this.updateParticipants();
      this.gamePhase.set('waiting');
      this.playerCard.set(null);
      this.location.set(null);
      this.cardFlipped.set(false);
      this.toastMessage.set(`🔄 Nowa gra przygotowana!`);
      this.showToast.set(true);
    };
    this.socketService.on('spy-game-reset', spyGameResetHandler);
    this.handlers.set('spy-game-reset', spyGameResetHandler);

    // Handler dla błędów
    const errorHandler = (error: any) => {
      this.toastMessage.set(`❌ ${error.message || 'Wystąpił błąd'}`);
      this.showToast.set(true);
    };
    this.socketService.on('error', errorHandler);
    this.handlers.set('error', errorHandler);
  }

  private updateGameMasterStatus(): void {
    // Sprawdzamy czy pierwszy gracz (twórca) to obecny użytkownik
    // W grze Spy pierwszy gracz (twórca) to mistrz gry
    const allPlayers = this.players();
    if (allPlayers.length > 0) {
      const firstPlayer = allPlayers[0];
      this.isGameMaster.set(firstPlayer?.token === this.currentPlayerToken());
    } else {
      this.isGameMaster.set(false);
    }
  }

  private updateParticipants(): void {
    // Uczestnicy to wszyscy oprócz mistrza gry (pierwszego gracza)
    const allPlayers = this.players();
    if (allPlayers.length > 1) {
      this.participants.set(allPlayers.slice(1));
    } else {
      this.participants.set([]);
    }
  }

  configureSpyCount(): void {
    const spyCount = this.spyCount();
    const participants = this.participants();
    
    if (spyCount <= 0 || spyCount >= participants.length) {
      this.toastMessage.set('❌ Liczba szpiegów musi być większa od 0 i mniejsza od liczby uczestników');
      this.showToast.set(true);
      return;
    }

    this.socketService.emit('spy-configure', {
      roomId: this.roomId(),
      spyCount: spyCount
    });
  }

  startGame(): void {
    if (this.players().length < 5) {
      this.toastMessage.set('❌ Minimum 4 uczestników + mistrz gry (łącznie 5 osób)');
      this.showToast.set(true);
      return;
    }

    if (!this.spyCount()) {
      this.toastMessage.set('❌ Najpierw ustaw liczbę szpiegów');
      this.showToast.set(true);
      return;
    }

    this.socketService.emit('spy-start-game', {
      roomId: this.roomId()
    });
  }

  endGame(): void {
    this.socketService.emit('spy-end-game', {
      roomId: this.roomId()
    });
  }

  newGame(): void {
    this.socketService.emit('spy-new-game', {
      roomId: this.roomId()
    });
  }

  flipCard(): void {
    this.cardFlipped.set(true);
  }

  leaveGame(): void {
    this.socketService.leaveGame();
    this.router.navigate(['/spy']);
  }
}
