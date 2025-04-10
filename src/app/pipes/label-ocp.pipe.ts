import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'labelOcp',
  standalone: false, 
})
export class LabelOcpPipe implements PipeTransform {

  transform(value: any): any {
    let ocup: number = value;
      var label;
      switch (ocup) {
          case 1:
              label = 'SGL';
              break;
          case 2:
              label = 'DBL';
              break;
          case 3:
              label = 'TRP';
              break;
          case 4:
              label = 'CPL';
              break;
          case 5:
              label = 'QPL';
              break;
      }
      return label;
  }

}
