import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'community-feed';
  now: Date;
  subscribe: any;
  /**
   *
   */
  constructor(translate: TranslateService) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(localStorage.getItem('lang') || 'he');
    try {
      const params = new URLSearchParams(location.search);
      const tenantId = params.get('ten');
      if (tenantId) {
        window.localStorage.setItem('ten', tenantId);
      }

    } catch (error) { }

  }
}
