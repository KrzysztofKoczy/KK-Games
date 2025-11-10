import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  IonIcon
} from '@ionic/angular/standalone';
import { playOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GuestAuthService } from '../../core/auth/guest-auth.service';
import { SocketService } from '../../core/socket/socket.service';

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss'],
  // host: {
  //   'class': 'ion-page'
  // }
})
export class HomePage implements OnInit {
  guestAuth = inject(GuestAuthService);
  socketService = inject(SocketService);
  router = inject(Router);

  readonly currentUser = this.guestAuth.currentUser;
  readonly isConnected = this.socketService.isConnected;

  constructor(
  ) {
    addIcons({ playOutline });
  }

  ngOnInit(): void {
    if (!this.socketService.isConnected()) {
      this.socketService.connect();
    }
  }

  navigateToGame(gameType: string): void {
    // Usuń focus z elementu przed nawigacją (rozwiązuje problem z aria-hidden)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.router.navigate(['/', gameType]);
  }
}

