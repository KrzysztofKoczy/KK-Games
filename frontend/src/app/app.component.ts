import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonApp, IonHeader, IonRouterOutlet, IonTitle, IonToggle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { GuestAuthService } from './core/auth/guest-auth.service';
import { SocketService } from './core/socket/socket.service';
import { ThemeService } from './core/theme/theme.service';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonToggle, IonToolbar, IonTitle, IonHeader, IonButton, IonIcon, ToastContainer],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit, OnDestroy {
  private location = inject(Location);
  private router = inject(Router);
  private guestAuth = inject(GuestAuthService);
  private socketService = inject(SocketService);
  private themeService = inject(ThemeService);
  
  private routerSubscription?: Subscription;
  
  title = 'Games App';
  canGoBack = this.themeService.canGoBack;
  currentUrl = this.themeService.currentUrl;
  darkMode = this.themeService.darkMode;
  
  readonly isAuthenticated = computed(() => this.guestAuth.isAuthenticated());
  readonly showLogout = computed(() => {
    return this.isAuthenticated() && this.currentUrl() !== '/login';
  });

  constructor() {
    addIcons({ arrowBackOutline, logOutOutline });
  }

  ngOnInit() {
    this.currentUrl.set(this.router.url);
    this.updateBackButtonVisibility();
    
    // Subskrypcja router events z właściwym czyszczeniem
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.updateBackButtonVisibility();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.socketService.disconnect();
    this.guestAuth.logout();
    this.router.navigate(['/login']);
  }

  private updateBackButtonVisibility(): void {
    this.themeService.updateBackButtonVisibility(this.router.url);
  }
}

