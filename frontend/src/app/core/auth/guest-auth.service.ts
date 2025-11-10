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
  private readonly STORAGE_NAME_KEY = 'guestName';
  
  // Angular Signal dla stanu użytkownika
  readonly currentUser = signal<GuestUser | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  constructor() {
    this.checkExistingSession();
  }

  /**
   * Sprawdza czy istnieje już sesja w localStorage
   */
  private checkExistingSession(): void {
    const token = localStorage.getItem(this.STORAGE_KEY);
    const name = localStorage.getItem(this.STORAGE_NAME_KEY);

    if (token && name) {
      // Użytkownik był już zalogowany
      const guestUser: GuestUser = {
        token,
        name
      };
      this.currentUser.set(guestUser);
      this.isAuthenticated.set(true);
    }
  }

  /**
   * Logowanie jako gość z nazwą użytkownika
   */
  loginAsGuest(name: string): void {
    if (!name || name.trim().length < 3 || name.trim().length > 256) {
      throw new Error('Nazwa użytkownika musi mieć między 3 a 256 znaków');
    }

    let token = localStorage.getItem(this.STORAGE_KEY);

    if (!token) {
      // Generuj nowy token UUID
      token = uuidv4();
      localStorage.setItem(this.STORAGE_KEY, token);
    }

    // Zapisz nazwę użytkownika
    localStorage.setItem(this.STORAGE_NAME_KEY, name.trim());

    const guestUser: GuestUser = {
      token,
      name: name.trim()
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
   * Wyloguj (usuń token i nazwę)
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_NAME_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}

