import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { environment } from 'src/environments/environment';
import { Agencia,UsuarioStyles, User  } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  usuarioInfo: User = new User();
  private usuarioInfoSubject = new BehaviorSubject<any>('');
  public usuarioInfoObserver = this.usuarioInfoSubject.asObservable();

  idOperador: any;
  private idOperadorSubject = new BehaviorSubject<any>('');
  public idOperadorObserver = this.idOperadorSubject.asObservable();

  usuarioStyles: UsuarioStyles = new UsuarioStyles();
  private usuarioStylesSubject = new BehaviorSubject<any>('');
  public usuarioStylesObserver = this.usuarioStylesSubject.asObservable();

  private sessionSubject:Subject<string> = new BehaviorSubject<string>('');

  private agenciaSubject: BehaviorSubject<Agencia>;
  public agenciaObserver: Observable<Agencia>;
  public agencia: Agencia = {
    id: 0,
    nomAgencia: '',
    agencia_logobanner: '',
    agencia_logodocs: '',
    agencia_pie: '',
    aoPass: '',
    aoUser: '',
    celular: 0,
    ciudad: '',
    currency: '',
    dirAgencia: '',
    direccionFiscal: '',
    estado: '',
    fecha_registro: '',
    idAgencia: 0,
    id_agencia: '',
    pais: '',
    razonSocial: '',
    redSocial: '',
    rfc: '',
    telefono: 0,
    utilidad: 0,
    facebook:'@',
    linkedIn: '@',
    instagram: '@',
    twitter: '@',

  }

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
      this.agenciaSubject = new BehaviorSubject<Agencia>(this.agencia);
      this.agenciaObserver = this.agenciaSubject.asObservable();
  }

  setAgencia(agencia: any) {
    this.agenciaSubject.next(agencia);
  }

  getHttpUsuarioInfo() {
    return this.http.get<any>(`${environment.apiUrl}me`).pipe(map(result => {
      this.setUsuarioInfo(result);
      return result;
    }));
  }
  setUsuarioInfo(usuarioInfo: any) {
    this.usuarioInfoSubject.next(usuarioInfo);
  }

  getUsuarioInfo() {
    return this.usuarioInfoObserver;
  }


  setIdOperador(idOpe: any) {
    // this.idOperadorSubject.next(await this.storage.get('access_ope'));
    this.idOperadorSubject.next(idOpe);
  }

  getIdOperador() {
    return this.idOperadorObserver;
  }

  getHttpStyles() {
    return this.http.get<any>(`${environment.apiUrl}color`).pipe(map(result => {
      return result;
    }));
  }

  setStyles(styles: any) {
    this.usuarioStylesSubject.next(styles);
  }

  getStyles() {
    return this.usuarioStylesObserver;
  }

  //* Permisos
	getSession() {
		return this.sessionSubject.asObservable();
	}

	setSession(data: string) {
    this.sessionSubject.next(data);
	}
	
	getHttpSession() {
		return this.http.get<any>(`${environment.apiUrl}permisos`).pipe(map(response => {
      this.setSession(JSON.stringify(response.data));
			//return response;
		}));
	}
}
