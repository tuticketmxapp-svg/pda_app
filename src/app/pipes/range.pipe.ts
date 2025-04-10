import { Pipe, PipeTransform } from '@angular/core';
@Pipe({name: 'range', standalone: false, })

export class RangePipe implements PipeTransform {
    transform(value: number): any {
        let result = [];
        for (let i = 0; i < value; i++) {
            result.push(i);
        }
        return result;
    }
}
