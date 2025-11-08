import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScannerPage } from './scanner.page';
import { ScannerPageRoutingModule } from './scanner-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { Broadcaster } from '@awesome-cordova-plugins/broadcaster/ngx';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { IonicStorageModule } from '@ionic/storage-angular';
export function HttpLoaderFactory(http: HttpClient) {

}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ScannerPageRoutingModule,
    FontAwesomeModule,
    PipesModule,
    IonicStorageModule.forRoot() // Esto inicializa correctamente el storage
  ],
  declarations: [ScannerPage],
  providers: [Broadcaster]
})
export class ScannerPageModule { }
