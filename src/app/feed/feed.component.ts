import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Feed } from './feed';
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
  demo = false;
  changeSlideTO: NodeJS.Timer;
  adminError = false;

  constructor(private dataService: DataService) {

  }

  ngOnInit() {
    if (!window.history.state.demoFeed) {
      this.feedFile = this.dataService.tenantId;
      this.fetchFeeds();
      setTimeout(() => { window.location.reload(); }, 24 * 60 * 60 * 1000);

      const refreshInterval = interval(600 * 1000);
      this.subscribeInterval = refreshInterval.subscribe(() => {
        this.fetchFeeds();
      });
    } else {
      this.demo = true;
      this.feeds = [window.history.state.demoFeed];
      this.currentIndex = 0;
      this.currentFeed = this.feeds[0];
    }
  }

  public getMainImage(f: Feed): string {
    // tslint:disable-next-line:max-line-length
    return f.imgSource || 'https://dummyimage.com/900x700/444/444.png';
  }
  private fetchFeeds() {
    const now = moment();
    this.dataService.getFeeds().subscribe(feeds => {
      this.feeds = feeds.filter((feed) => {
        return this.dataService.feedFilter(now, feed);

      });
      if (feeds && feeds.length) {
        this.currentIndex = 0;
        this.currentFeed = this.feeds[0];
        if (this.changeSlideTO) { clearTimeout(this.changeSlideTO); }
        this.nextSlide();
      } else {
        this.adminError = true;
      }
    });
  }
  nextSlide() {
    clearTimeout(this.changeSlideTO);
    if (this.feeds && this.feeds.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.feeds.length;
      this.currentFeed = this.feeds[this.currentIndex];
      this.changeSlideTO = setTimeout(() => {
        this.nextSlide();
      }, (this.currentFeed.durationSeconds || 10) * 1000);
    }

  }
}
