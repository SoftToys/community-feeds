import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Feed } from '../../feed/feed';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditFeedComponent } from '../edit-feed/edit-feed.component';
import { IdCard } from 'src/app/models';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import * as uuid from 'uuid';
import { TranslateService } from '@ngx-translate/core';

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
  confirmText: string;
  dontShow: boolean;
  @ViewChild('confirmation') public confirmation: TemplateRef<any>;
  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private router: Router,
    private modalService: NgbModal,
    public translate: TranslateService) { }

  ngOnInit() {
    this.code = localStorage.getItem('admin-code');
    this.codeOk = !!this.code;

    this.tenantId = localStorage.getItem('ten');
    if (this.tenantId) {
      this.fetchIdCard();
    }
  }
  switchLang(lang: string) {
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
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
      if (window.history.state.data) {
        if (this.feeds.findIndex(f => f.id === window.history.state.data.id) >= 0) {
          // updating existing..
          this.feeds = this.feeds.filter(f => f.id !== window.history.state.data.id);
          // this.feeds.push(window.history.state.data);
        }
        this.dataService.tryAddUpdateNonPublishedFeed(window.history.state.data as Feed);
        this.openNotification(this.translate.instant(`You need to 'Publish' your changes to take affect\nClick on Publish`), 'publish');
        delete window.history.state.data;
      }
      const nonPublishedFeeds = this.dataService.nonPublishedFeeds;
      this.containsChanges = nonPublishedFeeds && nonPublishedFeeds.length > 0;
      this.feeds = this.feeds.filter(f => nonPublishedFeeds.findIndex(npf => npf.id === f.id) < 0);
      this.feeds = [...this.feeds, ...nonPublishedFeeds];
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
      this.containsChanges = true;
      this.feeds = this.feeds.filter((v) => v !== feed);
      this.dataService.tryRemoveNonPublishedFeed(feed.id);
    }
  }

  /**
   * open
   *   const modalRef = this.modalService.open(NgbdModalContent);
   */
  public open(feed?: Feed) {
    this.router.navigate(['/admin/edit'], { state: { data: feed || { isActive: true, id: uuid.v4(), customClass: '', imgSource: 'https://dummyimage.com/900x700/444/444.png' } as Feed } });
    this.containsChanges = true;
  }
  openNotification(text: string, id: string) {
    if (JSON.parse(window.localStorage.getItem(id)) === true) {
      return;
    }
    this.confirmText = text;

    this.modalService.open(this.confirmation, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      if (this.dontShow) {
        window.localStorage.setItem(id, JSON.stringify(true));
      }
    }, () => {
    });
  }
  public publish() {
    const publish = confirm('Are you sure you want to publish changes?');
    if (publish) {
      this.loading = true;
      this.http.post(`https://feeds-admin.azurewebsites.net/api/HttpTrigger1?tenantId=${this.tenantId}&code=${this.code}`,
        this.feeds, { responseType: 'text' }).subscribe(
          (i) => {
            this.loading = false;
            this.containsChanges = false;
            this.dataService.clearNonPublishedFeeds();
          },
          (err) => {
            this.loading = false;
            if (err.statusText !== 'OK') {
              this.errorMsg = err.statusText || 'unable to save resources.. try again';
            }
          });
    }
  }

  public toggleMusic() {
    this.card.playSound = !this.card.playSound;
    this.loading = true;
    this.errorMsg = '';
    this.http.post(`https://feeds-admin.azurewebsites.net/api/update-card?tenantId=${this.tenantId}&code=${this.code}`,
      this.card).subscribe(
        (i) => {
          this.loading = false;
        },
        (err) => {
          this.loading = false;
          if (err.statusText !== 'OK') {
            this.errorMsg = err.statusText || 'unable to save resources.. try again';
          }
        });
  }
  public isShown(feed: Feed) {
    const now = moment();
    return this.dataService.feedFilter(now, feed);
  }
}
