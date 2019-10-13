import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { FeedComponent } from './feed/feed.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'feed', component: FeedComponent },
  { path: '**', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // we use hash cause we host it as static site that will result 404 otherwise
  exports: [RouterModule]
})
export class AppRoutingModule { }
