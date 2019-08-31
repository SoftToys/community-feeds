import { Component, OnInit, ViewChild } from '@angular/core';
import { Feed } from './feed';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
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

  @ViewChild('carousel') carousel: NgbCarousel;
  feeds: Feed[];
  feedFile: string;
  currentFeed: Feed;
  subscribeInterval: any;
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

        this.currentFeed = this.feeds[0];
      }
    });
  }

  ngOnInit() {
    const refreshInterval = interval(600 * 1000);
    this.subscribeInterval = refreshInterval.subscribe(() => {
      this.fetchFeeds();
    });
  }

  public onSlide(e: NgbSlideEvent) {
    const tokens = e.current.split('-');
    const currentIndex = Number(tokens[tokens.length - 1]);
    this.currentFeed = this.feeds[currentIndex];
  }

}
