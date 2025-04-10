import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({ name: 'fechaFormato' , standalone: false, })
export class FechaFormatoPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const opcionesFecha: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    const fecha = moment(value).toDate();
    return fecha.toLocaleDateString('es-ES', opcionesFecha);
  }
}
