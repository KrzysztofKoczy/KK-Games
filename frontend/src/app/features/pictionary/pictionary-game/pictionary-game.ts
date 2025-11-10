import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonBadge
} from '@ionic/angular/standalone';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Player, PlayerJoinedEvent, PlayerLeftEvent, GameCreatedEvent, PictionaryGameUpdateEvent } from '../../../core/socket/socket-events.types';

@Component({
  selector: 'app-pictionary-game',
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
    IonBadge
  ],
  templateUrl: './pictionary-game.html',
  styleUrls: ['./pictionary-game.scss'],
})
export class PictionaryGame implements OnInit, OnDestroy {
  readonly roomId = signal<string>('');
  readonly players = signal<Player[]>([]);
  readonly maxPlayers = signal<number>(12);
  readonly gameStatus = signal<string>('waiting');
  readonly currentPlayerToken = signal<string>('');
  readonly creatorToken = signal<string>('');
  readonly isCreator = signal<boolean>(false);

  private unsubscribeFunctions: (() => void)[] = [];

  private readonly toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private guestAuth: GuestAuthService
  ) {}

  ngOnInit(): void {
    const roomIdFromRoute = this.route.snapshot.paramMap.get('roomId');
    if (!roomIdFromRoute) {
      this.router.navigate(['/pictionary']);
      return;
    }

    this.roomId.set(roomIdFromRoute);
    const token = this.guestAuth.getGuestToken();
    this.currentPlayerToken.set(token || '');

    // Rejestruj handlery z zapisaniem funkcji do czyszczenia
    const playerJoinedHandler = (data: PlayerJoinedEvent) => {
      this.players.set(data.players || []);
      if (data.creator) {
        this.creatorToken.set(data.creator);
        this.isCreator.set(data.creator === this.currentPlayerToken());
      }
      this.toastService.info(`${data.player.name} dołączył do gry!`);
    };

    const gameCreatedHandler = (data: GameCreatedEvent) => {
      if (data.creator) {
        this.creatorToken.set(data.creator);
        this.isCreator.set(data.creator === this.currentPlayerToken());
      }
    };

    const playerLeftHandler = (data: PlayerLeftEvent) => {
      this.players.set(data.players || []);
      this.toastService.warning('Gracz opuścił grę');
    };

    const gameUpdateHandler = (data: PictionaryGameUpdateEvent) => {
      // Obsługa aktualizacji gry (do implementacji)
      this.gameStatus.set(data.status || 'waiting');
    };

    // Zapisz funkcje do czyszczenia
    this.unsubscribeFunctions.push(
      this.socketService.on('player-joined', playerJoinedHandler),
      this.socketService.on('game-created', gameCreatedHandler),
      this.socketService.on('player-left', playerLeftHandler),
      this.socketService.on('game-update', gameUpdateHandler)
    );
  }

  ngOnDestroy(): void {
    // Automatycznie opuść pokój gdy opuszczamy widok gry
    if (this.roomId()) {
      this.socketService.leaveGame();
    }
    
    // Wyczyść wszystkie listenery
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  leaveGame(): void {
    this.socketService.leaveGame();
    this.router.navigate(['/pictionary']);
  }
}
