import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
  lang: any;
  constructor(
    public authService: AuthService,
    private storage: Storage, 
  ) {  
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentToken = this.authService.currentTokenValue;
    if (!currentToken) {
      return next.handle(req);
    }
    const cloneReq = req.clone({
      
      headers: req.headers.set('Authorization', `Bearer ${currentToken}`).set('Lang', ` ${this.lang}`),
    });
    return next.handle(cloneReq);
  }
}
