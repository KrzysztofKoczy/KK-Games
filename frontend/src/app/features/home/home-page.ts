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
  IonItem,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { addCircleOutline, peopleOutline, playOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GuestAuthService } from '../../core/auth/guest-auth.service';
import { SocketService } from '../../core/socket/socket.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
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
    IonItem,
    IonLabel,
    IonIcon
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePage implements OnInit {
  guestAuth = inject(GuestAuthService);
  socketService = inject(SocketService);
  router = inject(Router);

  readonly currentUser = this.guestAuth.currentUser;
  readonly isConnected = this.socketService.isConnected;

  constructor(
  ) {
    addIcons({ addCircleOutline, peopleOutline, playOutline });
  }

  ngOnInit(): void {
    // Upewnij się, że socket jest połączony
    if (!this.socketService.isConnected()) {
      this.socketService.connect();
    }
  }

  navigateToGame(gameType: string): void {
    this.router.navigate(['/', gameType]);
  }
}

