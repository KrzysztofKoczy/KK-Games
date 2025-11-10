import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
  IonBadge,
  IonToast
} from '@ionic/angular/standalone';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';

interface Player {
  token: string;
  name: string;
}

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
    IonBadge,
    IonToast
  ],
  templateUrl: './pictionary-game.html',
  styleUrls: ['./pictionary-game.scss']
})
export class PictionaryGame implements OnInit, OnDestroy {
  readonly roomId = signal<string>('');
  readonly players = signal<Player[]>([]);
  readonly maxPlayers = signal<number>(12);
  readonly gameStatus = signal<string>('waiting');
  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly currentPlayerToken = signal<string>('');
  readonly creatorToken = signal<string>('');
  readonly isCreator = signal<boolean>(false);

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

      this.socketService.on('player-joined', (data) => {
        this.players.set(data.players || []);
        if (data.creator) {
          this.creatorToken.set(data.creator);
          this.isCreator.set(data.creator === this.currentPlayerToken());
        }
        this.toastMessage.set(`👥 ${data.player.name} dołączył do gry!`);
        this.showToast.set(true);
      });

      this.socketService.on('game-created', (data) => {
        if (data.creator) {
          this.creatorToken.set(data.creator);
          this.isCreator.set(data.creator === this.currentPlayerToken());
        }
      });

      this.socketService.on('player-left', (data) => {
        this.players.set(data.players || []);
        this.toastMessage.set(`👋 Gracz opuścił grę`);
        this.showToast.set(true);
      });

      this.socketService.on('game-update', (data) => {
        // Obsługa aktualizacji gry (do implementacji)
      });
    }
  }

  ngOnDestroy(): void {
    this.socketService.off('player-joined');
    this.socketService.off('player-left');
    this.socketService.off('game-update');
    this.socketService.off('game-created');
  }

  leaveGame(): void {
    this.socketService.leaveGame();
    this.router.navigate(['/pictionary']);
  }
}
