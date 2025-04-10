import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { InicioPageRoutingModule } from './inicio-routing.module';

import { InicioPage } from './inicio.page';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
export function HttpLoaderFactory(http: HttpClient) {
  
}
@NgModule({
  
  imports: [
    CommonModule,
    IonicModule,
    InicioPageRoutingModule,
    FontAwesomeModule,
  ],
  declarations: [InicioPage]
})
export class InicioPageModule {}
