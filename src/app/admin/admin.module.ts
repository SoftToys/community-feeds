import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { FeedsListComponent } from './feeds-admin/feeds-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EditFeedComponent } from './edit-feed/edit-feed.component';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AppModule } from '../app.module';

@NgModule({
  declarations: [
    FeedsListComponent,
    EditFeedComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgbModule,
    AdminRoutingModule,
    NgMultiSelectDropDownModule
  ],
  entryComponents: [EditFeedComponent]
})
export class AdminModule { }
