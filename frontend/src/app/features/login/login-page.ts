import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
} from '@ionic/angular/standalone';
import { GuestAuthService } from '../../core/auth/guest-auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss'],
  host: {
    'class': 'ion-page'
  }
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly guestAuth = inject(GuestAuthService);
  
  // loading = signal(false);
  // errorMsg = signal<string | null>(null);
  // guestNameError = signal<string | null>(null);
  // guestName = signal<string>('');

  // form = this.formBuilder.group({
  //   email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  //   password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]]
  // });

  // submit() {
  //   if (this.form.invalid || this.loading()) {
  //     return;
  //   }

  //   this.loading.set(true);

  //   // TODO: Implementacja logowania email + hasło w przyszłości`
  //   // this.authService.login(this.form.value).subscribe({
  //   //   next: () => {
  //   //     this.router.navigateByUrl('/home')
  //   //   },
  //   //   complete: () => {
  //   //     this.loading.set(false)
  //   //   },
  //   //   error: (error) => {
  //   //     this.errorMsg.set("Błędne hasło lub email");
  //   //     this.loading.set(false);
  //   //   }
  //   // });
  // }
  readonly guestNameError = signal<string | null>(null);
  readonly guestName = signal<string>('');

  onGuestNameChange(event: any): void {
    const value = event.detail.value || '';
    this.guestName.set(value);
    this.guestNameError.set(null);
  }

  loginAsGuest(): void {
    const name = this.guestName().trim();

    if (!name) {
      this.guestNameError.set('Proszę wpisać nazwę');
      return;
    }

    if (name.length < 3 || name.length > 256) {
      this.guestNameError.set('Nazwa musi mieć między 3 a 256 znaków');
      return;
    }

    try {
      this.guestAuth.loginAsGuest(name);
      
      // Pobierz returnUrl z query params lub użyj domyślnego
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
      
      // Usuń focus z przycisku przed nawigacją
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      this.router.navigate([returnUrl]);
    } catch (error: any) {
      this.guestNameError.set(error.message || 'Wystąpił błąd podczas logowania');
    }
  }
}

