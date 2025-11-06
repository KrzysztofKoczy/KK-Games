import { Component, OnInit, signal } from '@angular/core';
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
  IonAlert,
  IonToast
} from '@ionic/angular/standalone';
import { addCircleOutline, enterOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { SocketService } from '../../../core/socket/socket.service';
import { GuestAuthService } from '../../../core/auth/guest-auth.service';

@Component({
  selector: 'app-pictionary-lobby',
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
    IonAlert,
    IonToast
  ],
  templateUrl: './pictionary-lobby.html',
  styleUrls: ['./pictionary-lobby.scss']
})
export class PictionaryLobby implements OnInit {
  roomCode = '';
  readonly showToast = signal(false);
  readonly toastMessage = signal('');

  constructor(
    private socketService: SocketService,
    private guestAuth: GuestAuthService,
    private router: Router
  ) {
    addIcons({ addCircleOutline, enterOutline });
  }

  ngOnInit(): void {
    this.socketService.on('game-created', (data) => {
      this.toastMessage.set(`✅ Gra utworzona! Kod: ${data.roomId}`);
      this.showToast.set(true);
      setTimeout(() => {
        this.router.navigate(['/pictionary/game', data.roomId]);
      }, 1000);
    });

    this.socketService.on('player-joined', (data) => {
      this.toastMessage.set(`✅ Dołączono do gry!`);
      this.showToast.set(true);
      setTimeout(() => {
        this.router.navigate(['/pictionary/game', data.roomId]);
      }, 1000);
    });

    this.socketService.on('error', (error) => {
      this.toastMessage.set(`❌ ${error.message || 'Wystąpił błąd'}`);
      this.showToast.set(true);
    });
  }

  createGame(): void {
    this.socketService.createGame('pictionary', 12);
  }

  joinGame(): void {
    if (!this.roomCode.trim()) {
      this.toastMessage.set('❌ Wprowadź kod gry');
      this.showToast.set(true);
      return;
    }

    this.socketService.joinGame(this.roomCode.trim());
  }
}
