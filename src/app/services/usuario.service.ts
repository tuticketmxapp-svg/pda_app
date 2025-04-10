import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
// import { environment } from '@environments/environment';
import { environment } from 'src/environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  usuario: User | undefined;
  constructor(
    private http: HttpClient
  ) { }

  setUser(user: any) {
    this.usuario = user;
  }

  getDataUser() {
    return this.usuario;
  }
  
  getUser(id: any) {
    return this.http.get<any>(`${environment.apiUrl}user/${id}`).pipe(map(response => {
      this.setUser(response);
      return this.getDataUser();
    }));
  }
  
  savePerfil(data: any) {
    return this.http.post<any>(`${environment.apiUrl}editperfil`, data).pipe(map(response => {
      return response;
    }));
  }

  changePass(data: any) {
    return this.http.post<any>(`${environment.apiUrl}cambiarpass`, data).pipe(map(response => {
      return response;
    }));
  }
  
  changeImg(data: any) {
    return this.http.post<any>(`${environment.apiUrl}fotoperfil`, data).pipe(map(response => {
      return response;
    }));
  }
}
