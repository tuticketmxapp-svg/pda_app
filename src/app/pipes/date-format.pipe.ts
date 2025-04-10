import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'dateFormat',
  standalone: false, 
})
export class DateFormatPipe implements PipeTransform {

  transform(value: any): any {
    //let months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    let date = moment(value);
    let day = date.get('date');
    let month = date.format('MMM');
    let year = date.format('YY');
    return `<span>${day}</span> ${month}-${year}`;
  }

}
