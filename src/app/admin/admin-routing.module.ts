import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FeedsListComponent } from './feeds-admin/feeds-list.component';

const routes: Routes = [
  { path: 'admin', component: FeedsListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
