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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const roomIdFromRoute = this.route.snapshot.paramMap.get('roomId');
    if (roomIdFromRoute) {
      this.roomId.set(roomIdFromRoute);
      const socketData = this.socketService.getSocketData();
      this.currentPlayerToken.set(socketData?.guestToken || '');

      this.socketService.on('player-joined', (data) => {
        this.players.set(data.players || []);
        this.toastMessage.set(`👥 ${data.player.name} dołączył do gry!`);
        this.showToast.set(true);
      });

      this.socketService.on('player-left', (data) => {
        this.players.set(data.players || []);
        this.toastMessage.set(`👋 Gracz opuścił grę`);
        this.showToast.set(true);
      });

      this.socketService.on('game-update', (data) => {
        console.log('Game update:', data);
      });
    }
  }

  ngOnDestroy(): void {
    this.socketService.off('player-joined');
    this.socketService.off('player-left');
    this.socketService.off('game-update');
  }

  leaveGame(): void {
    this.socketService.leaveGame();
    this.router.navigate(['/pictionary']);
  }
}
