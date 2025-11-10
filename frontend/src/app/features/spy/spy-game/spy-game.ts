import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
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
  IonToast,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { SocketService } from '../../../core/socket/socket.service';
import { SpyGameService } from '../services/spy-game.service';

@Component({
  selector: 'app-spy-game',
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
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './spy-game.html',
  styleUrls: ['./spy-game.scss'],
  providers: [SpyGameService],
})
export class SpyGame implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);
  private readonly gameService = inject(SpyGameService);

  readonly roomId = signal<string>('');

  // Delegacja do serwisu
  readonly players = this.gameService.players;
  readonly currentPlayerToken = this.gameService.currentPlayerToken;
  readonly creatorToken = this.gameService.creatorToken;
  readonly isGameMaster = this.gameService.isGameMaster;
  readonly gamePhase = this.gameService.gamePhase;
  readonly spyCount = this.gameService.spyCount;
  readonly playerCard = this.gameService.playerCard;
  readonly location = this.gameService.location;
  readonly participants = this.gameService.participants;
  readonly cardFlipped = this.gameService.cardFlipped;
  readonly isConfiguring = this.gameService.isConfiguring;
  readonly isStarting = this.gameService.isStarting;
  readonly isEnding = this.gameService.isEnding;
  readonly isResetting = this.gameService.isResetting;

  readonly maxSpyCount = computed(() => {
    return Math.max(1, this.participants().length - 1);
  });

  readonly spyCountOptions = computed(() => {
    const max = this.maxSpyCount();
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    const roomIdFromRoute = this.route.snapshot.paramMap.get('roomId');
    if (!roomIdFromRoute) {
      this.router.navigate(['/spy']);
      return;
    }

    this.roomId.set(roomIdFromRoute);
    this.gameService.initialize(roomIdFromRoute);
  }

  ngOnDestroy(): void {
    // Automatycznie opuść pokój gdy opuszczamy widok gry
    if (this.roomId()) {
      this.socketService.leaveGame();
    }
    this.gameService.cleanup();
  }

  configureSpyCount(): void {
    const spyCount = this.spyCount();
    const participants = this.participants();
    this.gameService.configureSpyCount(spyCount, participants.length);
  }

  startGame(): void {
    const playersCount = this.players().length;
    const spyCount = this.spyCount();
    this.gameService.startGame(playersCount, spyCount);
  }

  endGame(): void {
    this.gameService.endGame();
  }

  newGame(): void {
    this.gameService.newGame();
  }

  flipCard(): void {
    this.gameService.flipCard();
  }

  leaveGame(): void {
    this.socketService.leaveGame();
    this.router.navigate(['/spy']);
  }
}
