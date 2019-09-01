import { Component, OnInit, ViewChild } from '@angular/core';
import { Feed } from './feed';
import { NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap/carousel/carousel';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import * as moment from 'moment';
import { DataService } from '../data.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  feeds: Feed[];
  feedFile: string;
  currentFeed: Feed;
  subscribeInterval: any;
  currentIndex = 0;
  constructor(private http: HttpClient, private dataService: DataService) {
    this.feedFile = dataService.tenantId;
    this.fetchFeeds();
    setTimeout(() => { window.location.reload(); }, 24 * 60 * 60 * 1000);
  }

  public getMainImage(f: Feed): string {
    // tslint:disable-next-line:max-line-length
    return f.imgSource || 'https://dummyimage.com/900x700/444/444.png';
  }
  private fetchFeeds() {
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.feedFile}/feeds.json?v=${now.unix()}`;
    this.http.get<Feed[]>(url).subscribe(feeds => {
      this.feeds = feeds.filter((feed) => {
        return this.dataService.feedFilter(now, feed);

      });
      if (feeds && feeds.length) {
        this.currentIndex = 0;
        this.currentFeed = this.feeds[0];
      }
    });
  }
  nextSlide() {
    if (this.feeds && this.feeds.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.feeds.length;
      this.currentFeed = this.feeds[this.currentIndex];
    }
  }

  ngOnInit() {
    const refreshInterval = interval(600 * 1000);
    this.subscribeInterval = refreshInterval.subscribe(() => {
      this.fetchFeeds();
    });
    const changeSlide = interval(10 * 1000);
    changeSlide.subscribe(() => {
      this.nextSlide();
    });
  }
}
