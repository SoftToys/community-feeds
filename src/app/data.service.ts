import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdCard } from './details';
import { HttpClient } from '@angular/common/http';

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
}
