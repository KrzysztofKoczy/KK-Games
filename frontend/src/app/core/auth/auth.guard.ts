import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GuestAuthService } from './guest-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const guestAuth = inject(GuestAuthService);
  const router = inject(Router);

  // Sprawdź czy użytkownik jest zalogowany (nawet jako gość)
  if (guestAuth.isAuthenticated()) {
    return true;
  }

  // Jeśli nie jest zalogowany, przekieruj do strony logowania
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

