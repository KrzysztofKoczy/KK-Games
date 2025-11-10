import { Injectable, signal, effect, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { GuestAuthService } from '../auth/guest-auth.service';
import { environment } from '../../../environments/environment';

export interface SocketEvent {
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  guestAuth = inject(GuestAuthService);
  
  private socket: Socket | null = null;
  
  // Angular Signals dla stanu połączenia
  readonly isConnected = signal<boolean>(false);
  readonly currentRoom = signal<string | null>(null);
  readonly connectionError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.guestAuth.isAuthenticated() && !this.socket) {
        this.connect();
      }
    });
  }

  /**
   * Połączenie z serwerem Socket.io
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.guestAuth.getGuestToken();
    
    if (!token) {
      console.error('❌ Brak tokenu gościa - nie można połączyć');
      return;
    }

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Event handlers
    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket?.id);
      this.isConnected.set(true);
      this.connectionError.set(null);
      
      // Automatycznie dołącz jako gość
      this.joinAsGuest(token);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.isConnected.set(false);
      this.currentRoom.set(null);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      this.connectionError.set(error.message);
      this.isConnected.set(false);
    });

    // Guest joined confirmation
    this.socket.on('guest-joined', (data) => {
      console.log('✅ Guest joined:', data);
    });

    // Error handler
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.connectionError.set(error.message || 'Unknown error');
    });
  }

  /**
   * Dołącz jako gość
   */
  private joinAsGuest(token: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('join-as-guest', { token });
  }

  /**
   * Rozłącz
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
      this.currentRoom.set(null);
    }
  }

  /**
   * Utwórz nową grę
   */
  createGame(gameType: string, maxPlayers: number = 12): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket nie jest połączony');
      return;
    }

    this.socket.emit('create-game', { gameType, maxPlayers });
  }

  /**
   * Dołącz do istniejącej gry
   */
  joinGame(roomId: string): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket nie jest połączony');
      return;
    }

    this.socket.emit('join-game', { roomId });
  }

  /**
   * Opuść grę
   */
  leaveGame(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-game');
    this.currentRoom.set(null);
  }

  /**
   * Wyślij akcję w grze
   */
  sendGameAction(action: string, data: any): void {
    if (!this.socket?.connected) return;

    this.socket.emit('game-action', {
      action,
      ...data
    });
  }

  /**
   * Wyślij event bezpośrednio (dla eventów specyficznych dla gier)
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) return;

    this.socket.emit(event, data);
  }

  /**
   * Nasłuchuj na eventy Socket.io
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;

    this.socket.on(event, callback);
  }

  /**
   * Usuń listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Pobierz instancję Socket (dla zaawansowanych przypadków)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Pobierz dane z socket (dla debugowania)
   /**
    * Pobierz dane z socket (dla debugowania)
    */
   getSocketData(): any {
     return this.socket ? { ...this.socket } : null;
   }
}
