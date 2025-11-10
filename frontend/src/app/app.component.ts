import { Component, signal, OnInit, effect, inject, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonApp, IonHeader, IonRouterOutlet, IonTitle, IonToggle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GuestAuthService } from './core/auth/guest-auth.service';
import { SocketService } from './core/socket/socket.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonToggle, IonToolbar, IonTitle, IonHeader, IonButton, IonIcon],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  private location = inject(Location);
  private router = inject(Router);
  private guestAuth = inject(GuestAuthService);
  private socketService = inject(SocketService);
  
  darkMode = signal(false);
  title = 'Games App';
  canGoBack = signal(false);
  currentUrl = signal<string>('');
  
  readonly isAuthenticated = computed(() => this.guestAuth.isAuthenticated());
  readonly showLogout = computed(() => {
    return this.isAuthenticated() && this.currentUrl() !== '/login';
  });

  constructor() {
    addIcons({ arrowBackOutline, logOutOutline });
    
    effect(() => {
      const isDark = this.darkMode();
      const htmlElement = document.documentElement;

      isDark ? htmlElement.classList.add('ion-palette-dark') : htmlElement.classList.remove('ion-palette-dark');

      localStorage.setItem('darkMode', String(isDark));
    });

    // Sprawdzaj czy można cofnąć się w historii
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.updateBackButtonVisibility();
      });
  }

  ngOnInit() {
    this.getModePreference();
    this.currentUrl.set(this.router.url);
    this.updateBackButtonVisibility();
  }

  toggleDarkMode() {
    this.darkMode.set(!this.darkMode());
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    // Rozłącz socket
    this.socketService.disconnect();
    
    // Wyloguj użytkownika
    this.guestAuth.logout();
    
    // Przekieruj do strony logowania
    this.router.navigate(['/login']);
  }

  private updateBackButtonVisibility(): void {
    // Sprawdź czy jest historia do cofnięcia (nie jesteśmy na głównej stronie)
    const currentUrl = this.router.url;
    const isLoginPage = currentUrl === '/login';
    const isHomePage = currentUrl === '/home';
    
    // Pokaż przycisk wstecz jeśli nie jesteśmy na login lub home (lub jeśli jest historia)
    this.canGoBack.set(!isLoginPage && !isHomePage);
  }

  private getModePreference() {
    if (localStorage.getItem('darkMode') !== null) {
      this.darkMode.set(localStorage.getItem('darkMode') === 'true');
    } else {
      this.darkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }
}

