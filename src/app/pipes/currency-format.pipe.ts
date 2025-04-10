import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: false, 
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let currency: string = value;
      if (value) {
          const decimal = value.toFixed(2);
          currency = '$' + decimal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      return currency;
  }

}
