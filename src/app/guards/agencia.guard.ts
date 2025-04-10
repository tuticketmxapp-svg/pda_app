import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { SharedService } from '../services';


@Injectable({
  providedIn: 'root'
})
export class AgenciaGuard implements CanActivate {
  user: { nivel: any; } | undefined
  constructor (
    private sharedService: SharedService
  ) {}

  canActivate() {
    this.sharedService.getUsuarioInfo().subscribe((user: { nivel: any; } | undefined) => this.user = user);
    const isAdmin = this.user?.nivel;
    if(isAdmin == 50) {
      return true;
    } else {
      return false;
    }
  }  
}
