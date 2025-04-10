import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private selectedIdiom$ = new BehaviorSubject<any>(
		{
			idioma: 'es',
		}
	);

  constructor() {

   }

   setSelectedIdiom(idioma: any){
		this.selectedIdiom$.next(idioma);
	}

	getSelectedIdiom$():Observable<any>{
		return this.selectedIdiom$.asObservable();
	}
}
