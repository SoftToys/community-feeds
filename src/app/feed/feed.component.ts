import { Component, OnInit, ViewChild } from '@angular/core';
import { Feed } from './feed';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
import { NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap/carousel/carousel';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';

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
  constructor(private http: HttpClient) {
    this.feedFile = 'ariklavi1';
    this.fetchFeeds();
  }

  private fetchFeeds() {
    const url = `https://communityfeeds.blob.core.windows.net/${this.feedFile}/feeds.json`;
    this.http.get<Feed[]>(url).subscribe(feeds => {
      const now = new Date();
      this.feeds = feeds.filter((f) => (!f.validFromDate || f.validFromDate > now) && (!f.validToDate || f.validToDate > now));
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
