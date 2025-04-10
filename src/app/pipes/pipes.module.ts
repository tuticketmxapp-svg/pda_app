import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RangePipe } from './range.pipe';
import { LabelOcpPipe } from './label-ocp.pipe';
import { CurrencyFormatPipe } from './currency-format.pipe';
import { DateFormatPipe } from './date-format.pipe';
import { FechaFormatoPipe } from './fecha.pipe';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [RangePipe, LabelOcpPipe, CurrencyFormatPipe, DateFormatPipe, FechaFormatoPipe],
    exports: [RangePipe, LabelOcpPipe, CurrencyFormatPipe, DateFormatPipe, FechaFormatoPipe],
    providers: [CurrencyFormatPipe]
})

export class PipesModule { }