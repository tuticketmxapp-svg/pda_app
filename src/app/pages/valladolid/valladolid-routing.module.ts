import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ValladolidPage } from './valladolid.page';

const routes: Routes = [
  {
    path: '',
    component: ValladolidPage
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ValladolidPageRoutingModule {}
