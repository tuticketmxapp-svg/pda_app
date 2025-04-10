import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
      private router: Router,
      private authService: AuthService,
      private navController: NavController
  ) { }

  canActivate() {
    const isAuth = this.authService.isAuthenticaded();
    if (isAuth) {
      return true;
    } else {
      this.navController.navigateBack('/inicio');
      return false;
    }
  }
}
