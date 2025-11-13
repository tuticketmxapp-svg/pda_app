import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from './error-handler.service';
import { throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EventoService {

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) { }

  getUser() {
    return this.http.get<any>(`${environment.apiUrl}me`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getEvent(id: number) {
    return this.http.get<any>(`${environment.apiUrl}events/${id}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getEvents(filters: any) {
    let params = '';
    (filters != '') ? params = '?' + filters : '';
    return this.http.get<any>(`${environment.apiUrl}events${params}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  listEvent() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/curent-events`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }

  tipeEvent() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/event-types`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }

  enclosures() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/enclosures`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  currency() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/currencies`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  statusEvent() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/event-status`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getUpcomingEvents(from: any, to: any) {
    return this.http.get<any>(`${environment.apiUrl}events/upcoming?from=${from}&to=${to}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  eventPlaces() {
    return this.http.get<any>(`${environment.apiUrl}catalogs/event-places`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getTicekts(id: any, filters: any) {
    let params = '';
    (filters != '') ? params = '?' + filters : '';
    return this.http.get<any>(`${environment.apiUrl}events/${id}/tickets${params}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getHistorial(id: any, date: any) {
    let params = '';
    (date!= '' && typeof date !=='undefined') ? params = '?date=' + date : '';
    return this.http.get<any>(`${environment.apiUrl}sales/lecturas/${id}${params}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  checkin(data: any){
    return this.http.post<any>(`${environment.apiUrl}sales/tickets/ckeckIn`,data).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  
  setSale(data: any) {
    localStorage.setItem('setSale', JSON.stringify(data));
  }

  getQr(qr:any){
    return this.http.get<any>(`${environment.apiUrl}leones/${qr}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  getHistorialQr(id:any) {
    return this.http.get<any>(`${environment.apiUrl}leones/tickets_event/${id}`).pipe(catchError(error => this.errorHandler.handleError(error)));
  }
  uploadScannedTickets(scans: any[]) {
  return this.http.post(`${environment.apiUrl}tickets/sync-scans`, { scans });
}

}

type Check = 0 | 1;
export interface EventZoneItem {
  "name": string,
  "price": number,
  "hex_color": string,
  "commission": number,
  "min_tickets": number,
  "max_tickets": number,
  "multiple": Check,
  "ticket_office": Check,
  "online": Check,
  "enabled": Check,
  "section": string,
  "access": string,
  "entry": string,
  "current_stock": number,
  "general_stock": number,
  "online_commission": number
}