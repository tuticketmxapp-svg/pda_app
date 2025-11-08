import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { SharedService } from './shared.service';

const TOKEN_KEY = 'access_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = null;
  authState = new BehaviorSubject(false);
  isAuth = new BehaviorSubject(false);
  currentTokenSubject = new BehaviorSubject(null);
  constructor(
    private http: HttpClient,
    private storage: Storage,
    private platform: Platform,
    private jwth: JwtHelperService,
    private sharedService: SharedService,
    private jwtHelper: JwtHelperService
  ) {
    this.platform.ready().then(() => {
      this.checkToken();
    });
  }
 public isTokenExpired(token: string): boolean {
    return this.jwtHelper.isTokenExpired(token);
  }
  checkToken() {
    return this.storage.get(TOKEN_KEY).then(token => {
      if (token) {
        this.currentTokenSubject.next(token);
        this.authState.next(true);
        this.isAuth.next(true);
        // let decoded = this.jwth.decodeToken(token);
        // let isExpired = this.jwth.isTokenExpired(token);
        // if (!isExpired) {
        //   this.user = decoded;
        //   this.currentTokenSubject.next(token);
        //   this.authState.next(true);
        //   this.isAuth.next(true);
        // } else {
        //   this.authState.next(false);
        //   this.isAuth.next(false);
        //   this.storage.remove(TOKEN_KEY);
        // }
      }
    });
  }

  login(credentials: any) {
    return this.http.post<any>(`${environment.apiUrl}login`, credentials).pipe(
      map(response => {
        console.log('environment',environment);
        if (response && response.access_token !== null) {
          const access_token = response.access_token;
          this.storage.set(TOKEN_KEY, access_token);
          this.authState.next(true);
          this.currentTokenSubject.next(access_token);
        }
        return response;
      })
    );
  }

  logout() {
    this.storage.remove(TOKEN_KEY).then(() => {
      this.currentTokenSubject.next(null);
      this.authState.next(false);
    });
  }

  forgot(userEmail: any) {
    return this.http.post<any>(`${environment.apiUrl}forgot`, userEmail).pipe(
      map(result => {
        return result;
      })
    );
  }

  isAuthenticaded() {
    return this.authState.value;
  }

  public get currentTokenValue() {
    return this.currentTokenSubject.value;
  }


}
