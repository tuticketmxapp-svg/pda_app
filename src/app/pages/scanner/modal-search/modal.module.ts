import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalSearchPageRoutingModule } from './modal-routing.module';
import { ModalScannerPage } from './modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ModalSearchPageRoutingModule
  ],
  declarations: [ModalScannerPage]
})
export class ModalSearchPageModule {}
