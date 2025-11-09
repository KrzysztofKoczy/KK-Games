import { Component, signal, OnInit, effect } from '@angular/core';
import { IonApp, IonHeader, IonRouterOutlet, IonTitle, IonToggle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonToggle, IonToolbar, IonTitle, IonHeader],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  darkMode = signal(false);
  title = 'Games App';

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      const htmlElement = document.documentElement;

      isDark ? htmlElement.classList.add('ion-palette-dark') : htmlElement.classList.remove('ion-palette-dark');

      localStorage.setItem('darkMode', String(isDark));
    });
  }

  ngOnInit() {
    this.getModePreference();
  }


  toggleDarkMode() {
    this.darkMode.set(!this.darkMode());
  }

  private getModePreference() {
    if (localStorage.getItem('darkMode') !== null) {
      this.darkMode.set(localStorage.getItem('darkMode') === 'true');
    } else {
      this.darkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }
}

