import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScannerPage } from './scanner.page';

const routes: Routes = [
  {
    path: '',
    component: ScannerPage
  },
  {
    path: 'modal',
    loadChildren: () => import('./modal/modal.module').then( m => m.ModalPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScannerPageRoutingModule {}
