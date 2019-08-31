import { Component, OnInit } from '@angular/core';
import { Feed } from '../../feed/feed';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditFeedComponent } from '../edit-feed/edit-feed.component';
import { IdCard } from 'src/app/details';
import { DataService } from 'src/app/data.service';


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
  errorMsg: any;
  code: string;
  codeOk: boolean;
  loading = false;
  containsChanges = false;
  card: IdCard;
  constructor(private http: HttpClient, private modalService: NgbModal, private dataService: DataService) { }

  ngOnInit() {
    this.code = localStorage.getItem('admin-code');
    this.codeOk = !!this.code;

    this.tenantId = localStorage.getItem('ten');
    if (this.tenantId) {
      this.fetchIdCard();
    }
  }
  setCode() {
    localStorage.setItem('admin-code', this.code);
    this.codeOk = true;
  }

  public fetchFeeds() {
    if (!this.tenantId) {
      return;
    }
    localStorage.setItem('ten', this.tenantId);
    this.loading = true;
    this.errorMsg = undefined;
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.tenantId}/feeds.json?v=${now.unix()}`;
    this.http.get<Feed[]>(url).subscribe(feeds => {
      this.feeds = feeds;
      this.loading = false;
    },
      (err: any) => {
        this.loading = false;
        this.errorMsg = err.statusText || 'unable to fetch resource..';
      },
    );
  }

  public fetchIdCard() {
    if (!this.tenantId) {
      return;
    }
    this.loading = true;
    this.errorMsg = undefined;
    const now = moment();
    const url = `https://communityfeeds.blob.core.windows.net/${this.tenantId}/idcard.json?v=${now.unix()}`;
    this.http.get<IdCard>(url).subscribe(id => {
      this.card = id;
      this.loading = false;
      this.fetchFeeds();
    },
      (err: any) => {
        this.loading = false;
        this.errorMsg = err.statusText || 'unable to fetch resource..';
      },
    );
  }
  public cleanCode() {
    const clean = confirm('Are you sure you want to logout?');
    if (clean) {
      this.code = undefined;
      this.codeOk = false;
      this.card = undefined;
      this.feeds = undefined;
      localStorage.removeItem('admin-code');
    }
  }

  public cleanTenant() {
    this.card = undefined;
    this.feeds = undefined;
  }

  public setActive(feed: Feed, active: boolean) {
    feed.isActive = active;
    this.containsChanges = true;
  }
  public delete(feed: Feed) {
    const deleteFeed = confirm('Are you sure you want to delete?');
    if (deleteFeed) {
      this.feeds = this.feeds.filter((v) => v !== feed);
    }
  }

  /**
   * open
   *   const modalRef = this.modalService.open(NgbdModalContent);
   */
  public open(feed?: Feed) {

    const modalRef = this.modalService.open(EditFeedComponent, { size: 'lg' });
    this.containsChanges = true;
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
    const publish = confirm('Are you sure you want to publish changes?');
    if (publish) {
      this.loading = true;
      this.http.post(`https://feeds-admin.azurewebsites.net/api/HttpTrigger1?tenantId=${this.tenantId}&code=${this.code}`,
        this.feeds).subscribe(
          (i) => {
            this.loading = false;
            this.containsChanges = false;
          },
          (err) => {
            this.loading = false;
            if (err.statusText !== 'OK') {
              this.errorMsg = err.statusText || 'unable to save resources.. try again';
            }
          });

    }
  }
  public isShown(feed: Feed) {
    const now = moment();
    return this.dataService.feedFilter(now, feed);
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
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }
}
