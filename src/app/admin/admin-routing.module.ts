import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FeedsListComponent } from './feeds-admin/feeds-list.component';
import { EditFeedComponent } from './edit-feed/edit-feed.component';

const routes: Routes = [
  {
    path: 'admin',
    children: [

      { path: 'edit', component: EditFeedComponent },
      { path: '', component: FeedsListComponent },
    ]


  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
