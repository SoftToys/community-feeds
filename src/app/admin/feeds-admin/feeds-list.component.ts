import { Component, OnInit } from '@angular/core';
import { Feed } from '../../feed/feed';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditFeedComponent } from '../edit-feed/edit-feed.component';

@Component({
  selector: 'app-feeds-list',
  templateUrl: './feeds-list.component.html',
  styleUrls: ['./feeds-list.component.scss']
})
export class FeedsListComponent implements OnInit {

  tenantId: string;
  feeds: Feed[];
  closeResult: string;
  currentlyEditing: Feed;
  constructor(private http: HttpClient, private modalService: NgbModal) { }

  ngOnInit() {
    this.tenantId = 'ariklavi1';
    this.fetchFeeds();
  }

  private fetchFeeds() {
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.tenantId}/feeds.json?v=${now.unix()}`;
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
    });
  }

  public setActive(feed: Feed, active: boolean) {
    feed.isActive = active;
  }


  /**
   * open
   *   const modalRef = this.modalService.open(NgbdModalContent);
   */
  public open(feed?: Feed) {
    const modalRef = this.modalService.open(EditFeedComponent);
    modalRef.componentInstance.feed = feed || { isActive: true };
    modalRef.result.then((result) => {
      if (feed) { // new
        this.feeds = this.feeds.filter((v) => v !== feed);
      }
      this.feeds.push(result);
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }
  public publish() {

  }
  public createNew(content) {
    this.currentlyEditing = { isActive: true };
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.feeds.push(result);
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  public edit(content, feed: Feed) {
    this.currentlyEditing = feed;
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }
}
