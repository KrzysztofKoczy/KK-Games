import { Injectable, signal, effect, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { GuestAuthService } from '../auth/guest-auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private readonly guestAuth = inject(GuestAuthService);
  private readonly toastService = inject(ToastService);
  
  private socket: Socket | null = null;
  
  readonly isConnected = signal<boolean>(false);
  readonly currentRoom = signal<string | null>(null);
  readonly isConnecting = signal<boolean>(false);
  readonly isCreatingGame = signal<boolean>(false);
  readonly isJoiningGame = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.guestAuth.isAuthenticated() && !this.socket) {
        this.connect();
      }
    });
  }

    createGame(gameType: string, maxPlayers: number = 12): void {
      if (!this.socket?.connected) {
        this.toastService.error('Brak połączenia z serwerem');
        return;
      }
  
      if (this.isCreatingGame()) return;
  
      this.isCreatingGame.set(true);
      this.socket.emit('create-game', { gameType, maxPlayers });
      
      // Reset po 5 sekundach
      setTimeout(() => this.isCreatingGame.set(false), 5000);
    }
  
    joinGame(roomId: string): void {
      if (!this.socket?.connected) {
        this.toastService.error('Brak połączenia z serwerem');
        return;
      }
  
      if (this.isJoiningGame()) return;
  
      this.isJoiningGame.set(true);
      this.socket.emit('join-game', { roomId });
      this.currentRoom.set(roomId);
      
      // Reset po 5 sekundach
      setTimeout(() => this.isJoiningGame.set(false), 5000);
    }
  
    leaveGame(): void {
      if (!this.socket?.connected) return;
      
      this.socket.emit('leave-game');
      this.currentRoom.set(null);
    }

    sendGameAction(action: string, data: any): void {
      if (!this.socket?.connected) return;

      this.socket.emit('game-action', { action, ...data });
    }
  
    emit(event: string, data: any): void {
      if (!this.socket?.connected) return;

      this.socket.emit(event, data);
    }
  
    /**
     * Nasłuchuj na eventy Socket.io
     */
    on(event: string, callback: (data: any) => void): () => void {
      if (!this.socket) return () => {};
      
      this.socket.on(event, callback);

      return () => this.socket?.off(event, callback);
    }
  
    /**
     * Usuń listener
     */
    off(event: string, callback?: (data: any) => void): void {
      if (!this.socket) return;

      this.socket.off(event, callback);
    }
  
    /**
     * Pobierz instancję Socket
     */
    getSocket(): Socket | null {
      return this.socket;
    }

  /**
   * Połączenie z serwerem Socket.io
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting()){
      return;
    } 

    const token = this.guestAuth.getGuestToken();
    
    if (!token) {
      this.toastService.error('Brak tokenu gościa');

      return;
    }

    this.isConnecting.set(true);
    this.createSocket();
    this.setupEventHandlers(token);
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
      this.currentRoom.set(null);
    }
  }

  /**
   * Tworzy nowe połączenie Socket.io
   */
  private createSocket(): void {
    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
  }

  /**
   * Konfiguruje wszystkie handlery eventów
   */
  private setupEventHandlers(token: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => this.handleConnect(token));
    this.socket.on('disconnect', (reason: string) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error: Error) => this.handleConnectError(error));
    this.socket.on('guest-joined', () => this.handleGuestJoined());
    this.socket.on('error', (error: any) => this.handleError(error));
  }

  private handleConnect(token: string): void {
    this.isConnected.set(true);
    this.isConnecting.set(false);
    this.toastService.success('Połączono z serwerem');
    this.joinAsGuest(token);
  }

  private handleDisconnect(reason: string): void {
    this.isConnected.set(false);
    this.isConnecting.set(false);
    this.currentRoom.set(null);
    
    if (reason !== 'io client disconnect') {
      this.toastService.warning('Rozłączono z serwerem');
    }
  }

  private handleConnectError(error: Error): void {
    this.isConnected.set(false);
    this.isConnecting.set(false);
    this.toastService.error(`Błąd połączenia: ${error.message}`);
  }

  private handleGuestJoined(): void {
    this.toastService.success('Zalogowano jako gość');
  }

  private handleError(error: any): void {
    this.toastService.error(error.message || 'Wystąpił błąd');
  }

  private joinAsGuest(token: string): void {
    if (!this.socket?.connected) return;

    const user = this.guestAuth.getCurrentUser();
    const name = user?.name || `Gracz ${token.substring(0, 8)}`;

    this.socket.emit('join-as-guest', { token, name });
  }
}
