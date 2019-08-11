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
  constructor(private http: HttpClient, dataService: DataService) {
    this.feedFile = dataService.tenantId;
    this.fetchFeeds();
  }

  private fetchFeeds() {
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.feedFile}/feeds.json?v=${now.unix()}`;
    this.http.get<Feed[]>(url).subscribe(feeds => {
      this.feeds = feeds.filter((feed) => {
        const isValid =
          (!feed.validFromDate || moment(feed.validFromDate, 'DD/MM/YYYY') < now) &&
          (!feed.validToDate || moment(feed.validToDate, 'DD/MM/YYYY') > now) &&
          (feed.isActive !== false) &&
          (!feed.day ||
            (
              feed.day.includes(now.weekday()) &&
              (feed.day[0] !== now.weekday() || !feed.fromHour || now.hour() > feed.fromHour) &&
              (feed.day[feed.day.length - 1] !== now.weekday() || !feed.tillHour || now.hour() < feed.tillHour)
            )
          );
        return isValid;

      });
      if (feeds && feeds.length) {

        this.currentFeed = this.feeds[0];
      }
    });
  }

  ngOnInit() {
  }

  public onSlide(e: NgbSlideEvent) {
    const tokens = e.current.split('-');
    const currentIndex = Number(tokens[tokens.length - 1]);
    this.currentFeed = this.feeds[currentIndex];
  }

}
