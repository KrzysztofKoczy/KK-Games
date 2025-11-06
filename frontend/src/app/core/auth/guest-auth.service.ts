import { Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface GuestUser {
  token: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuestAuthService {
  private readonly STORAGE_KEY = 'guestToken';
  
  // Angular Signal dla stanu użytkownika
  readonly currentUser = signal<GuestUser | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  constructor() {
    this.initializeGuest();
  }

  /**
   * Inicjalizacja Guest Mode - sprawdza localStorage lub tworzy nowy token
   */
  private initializeGuest(): void {
    let token = localStorage.getItem(this.STORAGE_KEY);

    if (!token) {
      // Generuj nowy token UUID
      token = uuidv4();
      localStorage.setItem(this.STORAGE_KEY, token);
    }

    const guestUser: GuestUser = {
      token,
      name: `Gracz ${token.substring(0, 8)}`
    };

    this.currentUser.set(guestUser);
    this.isAuthenticated.set(true);
  }

  /**
   * Pobierz aktualny token gościa
   */
  getGuestToken(): string | null {
    const user = this.currentUser();
    return user?.token || null;
  }

  /**
   * Pobierz aktualnego użytkownika
   */
  getCurrentUser(): GuestUser | null {
    return this.currentUser();
  }

  /**
   * Zmień nazwę gracza (opcjonalnie)
   */
  updatePlayerName(name: string): void {
    const current = this.currentUser();
    if (current) {
      const updated: GuestUser = {
        ...current,
        name: name || current.name
      };
      this.currentUser.set(updated);
    }
  }

  /**
   * Wyloguj (usuń token)
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    
    // Generuj nowy token dla następnej sesji
    this.initializeGuest();
  }
}

