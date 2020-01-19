import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { FeedComponent } from './feed/feed.component';
import { NewsFeedComponent } from './news-feed/news-feed.component';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GreetingComponent } from './greeting/greeting.component';
import { DataService } from './data.service';
import { AdminModule } from './admin/admin.module';
import { AppRoutingModule } from './app-routing,module';
import { MainComponent } from './main/main.component';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from './safe-html.pipe';

@NgModule({
  declarations: [
    AppComponent,
    FeedComponent,
    NewsFeedComponent,
    GreetingComponent,
    MainComponent,
    SafeHtmlPipe
  ],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    NgbModule,
    HttpClientJsonpModule,
    AdminModule,
    AppRoutingModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
