import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IdCard, Articles } from './models';
import { HttpClient } from '@angular/common/http';
import { Feed } from './feed/feed';
import * as moment from 'moment';
import { ThrowStmt, TryCatchStmt } from '@angular/compiler';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  nonPublishedFeeds: Feed[] = [];
  details: BehaviorSubject<IdCard>;
  tenantId: string;
  constructor(private http: HttpClient) {
    this.tenantId = window.localStorage.getItem('ten');
    this.details = new BehaviorSubject({ greeting: 'Loading..' } as IdCard);

    if (this.tenantId) {
      this.reload();
    }
  }
  public setTenant(tenantId: string) {
    this.tenantId = tenantId;
    window.localStorage.setItem('ten', this.tenantId);
    this.reload();
  }

  public getTopNewsHeadlines(): Observable<Articles> {
    const now = moment();
    // const url = `https://newsapi.org/v2/top-headlines?sources=ynet&apiKey=${this.idCard.newsApiKey}&v=${now.unix()}`;
    const url = `https://communityfeeds.blob.core.windows.net/data/top_headlines.json?v=${now.unix()}`;
    return this.http.get<Articles>(url);
  }

  public reload() {
    this.http.get<IdCard>(`https://communityfeeds.blob.core.windows.net/${this.tenantId}/idcard.json?v=${new Date().getTime()}`)
      .subscribe((d) => {
        this.details.next(d);
      });
  }

  public feedFilter(nowTime: moment.Moment, feed: Feed): boolean {

    const validDates = (!feed.validFromDate || moment(feed.validFromDate, 'DD/MM/YYYY') < nowTime) &&
      (!feed.validToDate || moment(feed.validToDate, 'DD/MM/YYYY') > nowTime);

    const hasDaysFilter = feed.day && feed.day.length > 0;
    const isMatchDays =
      !hasDaysFilter ||
      (
        feed.day.map(d => d.id).includes(nowTime.weekday()) &&
        (feed.day[0].id !== nowTime.weekday() || !feed.fromHour || nowTime.hour() >= feed.fromHour) &&
        (feed.day[feed.day.length - 1].id !== nowTime.weekday() || !feed.tillHour || nowTime.hour() < feed.tillHour)
      );

    const validHours = hasDaysFilter || (
      (!feed.fromHour || nowTime.hour() >= feed.fromHour) &&
      (!feed.tillHour || nowTime.hour() < feed.tillHour)
    );

    return feed.isActive && validDates && isMatchDays && validHours;
  }
  public getFeeds(): Observable<Feed[]> {
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.tenantId}/feeds.json?v=${now.unix()}`;
    return this.http.get<Feed[]>(url);
  }
  /**
   * getWeather
   */
  public getWeather(): Observable<{ main: any, weather: any }> {

    return this.http.get<{ main: any, weather: any }>(`https://api.openweathermap.org/data/2.5/weather?q=${this.details.value.location}&appid=${this.details.value.weatherAppId}&units=metric`);
  }

  public fetchWaveHeigth(callback: (waves: any[]) => void) {
    const callbackFncName = `waves_${new Date().getTime()}`;
    // tslint:disable-next-line:max-line-length
    this.jsonp(`https://magicseaweed.com/api/${this.details.value.magicSeaWeedKey}/forecast/?spot_id=${this.details.value.magicSeaWeedSpot}&callback=${callbackFncName}`,
      (d) => {
        callback(d);
      }, callbackFncName);
  }
  private jsonp(url: string, callback: (r: any) => any, callbackName: string) {
    url = url || '';
    const generatedFunction = callbackName;

    window[generatedFunction] = (json) => {
      callback(json);

      try {
        delete window[generatedFunction];
      } catch (e) { }

    };

    if (url.indexOf('?') === -1) { url = url + '?'; } else { url = url + '&'; }
    // 5 - //not using element.setAttribute()
    const jsonpScript = document.createElement('script');
    jsonpScript.src = url + 'callback=' + generatedFunction;
    jsonpScript.type = 'text/javascript';
    jsonpScript.className = 'cross';
    jsonpScript.async = true;
    document.getElementsByTagName('head')[0].appendChild(jsonpScript);
  }
  private addNonPublishedFeed(feed: Feed): Feed[] {
    this.nonPublishedFeeds.push(feed);
    return this.nonPublishedFeeds;
  }
  clearNonPublishedFeeds() {
    this.nonPublishedFeeds = [];
  }
  tryRemoveNonPublishedFeed(id: any) {
    this.nonPublishedFeeds = this.nonPublishedFeeds.filter((v) => v.id !== id);
  }
  tryAddUpdateNonPublishedFeed(f: Feed) {
    this.tryRemoveNonPublishedFeed(f.id);
    this.addNonPublishedFeed(f);
    return this.nonPublishedFeeds;
  }
}
