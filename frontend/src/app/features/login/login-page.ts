import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonLabel,
  IonItem
} from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonItem,
    IonLabel,
    IonInput,   
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss']
})
export class LoginPage {
  formBuilder = inject(FormBuilder);
  router = inject(Router);
  
  loading = signal(false);
	errorMsg = signal<string | null>(null);
  form = this.formBuilder.group({
		email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
		password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]]
	});

	submit() {
		if (this.form.invalid || this.loading()) {
			return;
		}

	  this.loading.set(true);

    // TODO: Implementacja logowania email + hasło w przyszłości`
    // this.authService.login(this.form.value).subscribe({
    //   next: () => {
    //     this.router.navigateByUrl('/home')
    //   },
    //   complete: () => {
    //     this.loading.set(false)
    //   },
    //   error: (error) => {
    //     this.errorMsg.set("Błędne hasło lub email");
    //     this.loading.set(false);
    //   }
    // });
	}
}

