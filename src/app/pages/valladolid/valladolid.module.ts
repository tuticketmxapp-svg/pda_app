import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ValladolidPage } from './valladolid.page';
import { ValladolidPageRoutingModule } from './valladolid-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ValladolidPageRoutingModule
  ],
  declarations: [ValladolidPage]
})
export class ValladolidPageModule {}
