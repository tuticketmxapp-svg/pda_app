import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StarsComponent } from './stars.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PipesModule } from 'src/app/pipes/pipes.module';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PipesModule,
    FontAwesomeModule
  ],
  declarations: [
    StarsComponent,
  ],
  exports: [
    StarsComponent,
  ]
})
export class StarsModule { }