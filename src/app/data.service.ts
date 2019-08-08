import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdCard } from './details';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // this.newsApiKey = '3ef38f994f794ecfbe563db621e56863';
  // this.greeting = 'אריק לביא 1';
  // this.location = 'Netanya,il';
  // this.weatherAppId = '5e6688a21dfb2d2d8e7b4b57b0e88534';
  // this.magicSeaWeedKey = 'af5ebfb429b64e6c70f8cd3b38a8760a';
  // this.magicSeaWeedSpot = 4558;

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
}
