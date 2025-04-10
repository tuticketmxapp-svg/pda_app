import { Component, Input, OnChanges } from '@angular/core';
@Component({
  selector: 'app-stars',
  template: `
    <fa-icon icon="star" *ngFor="let i of (stars | range)" class="star-color"></fa-icon>
    <fa-icon icon="star-half-alt" *ngIf="decimal" class="star-color"></fa-icon>
    <fa-icon [icon]="['far', 'star']" *ngFor="let i of (empty | range)" class="star-color empty"></fa-icon>
  `
})
export class StarsComponent implements OnChanges{
    @Input() stars: number | undefined;
    decimal: boolean = false;
    empty = 0;

    constructor() {}

    ngOnChanges() {
        this.getRange(this.stars);
    }

    getRange(stars: string | undefined | number) {
        switch (stars) {
            case '1':
            case 'S1':
            case 'H1':
                this.stars = 1;
                this.empty = 6 - this.stars;
                break;
            case '1.5':
            case 'S15':
            case 'H1_5':
                this.stars = 1;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
            case '2':
            case 'S2':
            case 'H2':
                this.stars = 2;
                this.empty = 6 - this.stars;
                break;
            case '2.5':
            case 'S25':
            case 'H2_5':
                this.stars = 2;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
            case '3':
            case 'S3':
            case 'H3':
                this.stars = 3;
                this.empty = 6 - this.stars;
                break;
            case '3.5':
            case 'S35':
            case 'H3_5':
                this.stars = 3;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
            case '4':
            case 'S4':
            case 'H4':
                this.stars = 4;
                this.empty = 6 - this.stars;
                break;
            case '4.5':
            case 'S45':
            case 'H4_5':
                this.stars = 4;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
            case '5':
            case 'S5':
            case 'H5':
                this.stars = 5;
                this.empty = 6 - this.stars;
                break;
            case '5.5':
            case 'S55':
            case 'H5_5':
                this.stars = 5;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
            case '6':
            case 'S6':
            case 'H6':
                this.stars = 6;
                this.empty = 6 - this.stars;
                break;
            case '6.5':
            case 'S65':
            case 'H6_5':
                this.stars = 6;
                this.empty = 6 - this.stars;
                this.decimal = true;
                break;
        }
    }
}
