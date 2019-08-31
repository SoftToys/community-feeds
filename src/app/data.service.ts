import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdCard } from './details';
import { HttpClient } from '@angular/common/http';
import { Feed } from './feed/feed';
import * as moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  details: BehaviorSubject<IdCard>;
  tenantId: string;
  constructor(private http: HttpClient) {
    this.tenantId = window.localStorage.getItem('ten');
    this.details = new BehaviorSubject({ greeting: 'Loading..' } as IdCard);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ten')) {
      this.tenantId = urlParams.get('ten');
      window.localStorage.setItem('ten', this.tenantId);
    }

    this.http.get<IdCard>(`https://communityfeeds.blob.core.windows.net/${this.tenantId}/idcard.json?v=${new Date().getTime()}`)
      .subscribe((d) => {
        this.details.next(d);
      });
  }
  public feedFilter(nowTime: moment.Moment, feed: Feed): boolean {
    const isValid =
      (!feed.validFromDate || moment(feed.validFromDate, 'DD/MM/YYYY') < nowTime) &&
      (!feed.validToDate || moment(feed.validToDate, 'DD/MM/YYYY') > nowTime) &&
      (feed.isActive !== false) &&
      ((!feed.day || feed.day.length === 0) ||
        (
          feed.day.map(d => d.id).includes(nowTime.weekday()) &&
          (feed.day[0].id !== nowTime.weekday() || !feed.fromHour || nowTime.hour() > feed.fromHour) &&
          (feed.day[feed.day.length - 1].id !== nowTime.weekday() || !feed.tillHour || nowTime.hour() < feed.tillHour)
        )
      );
    return isValid;
  }
}
