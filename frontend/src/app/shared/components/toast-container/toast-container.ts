import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonToast } from '@ionic/angular/standalone';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IonToast],
  template: `
    @for (toast of toasts(); track toast.id) {
      <ion-toast
        [isOpen]="true"
        [message]="toast.message"
        [duration]="toast.duration"
        [color]="getToastColor(toast.type)"
        (didDismiss)="onToastDismiss(toast.id)"
        [position]="'top'"/>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      pointer-events: none;
    }
  `]
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts$;

  getToastColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  }

  onToastDismiss(id: string): void {
    this.toastService.remove(id);
  }
}

