import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { FeedsListComponent } from './feeds-admin/feeds-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EditFeedComponent } from './edit-feed/edit-feed.component';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

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
    NgMultiSelectDropDownModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  entryComponents: [EditFeedComponent]
})
export class AdminModule { }
