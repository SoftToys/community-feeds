import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Articles, ArticleEntity } from './articles';
import { Observable, Subscription } from 'rxjs';
import { interval } from 'rxjs';
import * as moment from 'moment';
import { DataService } from '../data.service';
import { IdCard } from '../details';


@Component({
  selector: 'app-news-feed',
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss']
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  headlines: ArticleEntity[];
  currentHeadlineIndex = 0;
  subscribe: Subscription;
  subscribeHeadlines: Subscription;
  newsApiKey: string;
  idCard: IdCard;

  constructor(private http: HttpClient, private dataService: DataService) {

  }

  ngOnInit() {
    this.dataService.details.subscribe(details => {
      this.idCard = details;
      if (this.idCard.newsApiKey) {
        this.fetchHeadlines();

        const changeAtricle = interval(12 * 1000);
        this.subscribe = changeAtricle.subscribe(val => {
          if (this.headlines) {
            this.currentHeadlineIndex = (this.currentHeadlineIndex + 1) % this.headlines.length;
          }
        });
        const refreshTopHeadlines = interval(600 * 1000);
        this.subscribeHeadlines = refreshTopHeadlines.subscribe(() => {
          this.fetchHeadlines();
        });
      }
    });
  }
  private fetchHeadlines() {
    const now = moment();
    const url = `https://newsapi.org/v2/top-headlines?sources=ynet&apiKey=${this.idCard.newsApiKey}&v=${now.unix()}`;
    this.http.get<Articles>(url).subscribe(a => {
      if (a.status === 'ok' && a.articles && a.articles.length > 0) {
        this.headlines = a.articles;
        this.currentHeadlineIndex = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscribe.unsubscribe();
  }
  get currentHeadline(): ArticleEntity {
    if (this.headlines) {
      const current = this.headlines[this.currentHeadlineIndex];
      if (!current.publishedAtUtc && current.publishedAt) {
        const offset = new Date().getTimezoneOffset() / 60;
        // let pat = moment(current.publishedAt.replace('Z', `+0${Math.abs(offset)}:00`));
        let pat = moment(current.publishedAt.replace('Z', `+0${Math.abs(offset)}:00`));
        pat = pat.subtract(120, 'minutes');
        current.publishedAtUtc = moment(pat).toDate();
      }
      return current;
    }
    return { title: 'loading...', publishedAt: '' };
  }

}
