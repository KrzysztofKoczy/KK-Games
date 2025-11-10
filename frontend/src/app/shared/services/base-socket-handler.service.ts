import { Injectable, inject } from '@angular/core';
import { SocketService } from '../../core/socket/socket.service';

/**
 * Bazowa klasa do zarządzania socket listenerami
 * Eliminuje powtarzającą się logikę z GameLobbyService i SpyGameService
 */
@Injectable()
export abstract class BaseSocketHandlerService {
  protected readonly socketService = inject(SocketService);
  
  private unsubscribeFunctions: (() => void)[] = [];

  /**
   * Rejestruje listener socket i zwraca funkcję do czyszczenia
   */
  protected registerListener(event: string, callback: (data: any) => void): void {
    const unsubscribe = this.socketService.on(event, callback);
    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Czyści wszystkie zarejestrowane listenery
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

