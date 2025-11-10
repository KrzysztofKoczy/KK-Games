import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'darkMode';
  
  private readonly initialDarkMode = (() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Użyj preferencji systemowej
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  })();

  readonly darkMode = signal<boolean>(this.initialDarkMode);
  readonly canGoBack = signal<boolean>(false);
  readonly currentUrl = signal<string>('');

  constructor() {
    this.applyDarkMode(this.initialDarkMode);
    
    effect(() => {
      const isDark = this.darkMode();

      this.applyDarkMode(isDark);
      this.saveDarkMode(isDark);
    });
  }

  toggleDarkMode(): void {
    this.darkMode.set(!this.darkMode());
  }

  updateBackButtonVisibility(currentUrl: string): void {
    const isLoginPage = currentUrl === '/login';
    const isHomePage = currentUrl === '/home';
    
    this.canGoBack.set(!isLoginPage && !isHomePage);
  }

  private applyDarkMode(isDark: boolean): void {
    isDark ? document.documentElement.classList.add('ion-palette-dark') : document.documentElement.classList.remove('ion-palette-dark');
  }

  private saveDarkMode(isDark: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, String(isDark));
  }
}

