import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Articles, ArticleEntity } from './articles';
import { Observable, Subscription } from 'rxjs';
import { interval } from 'rxjs';


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

  constructor(private http: HttpClient) { }

  ngOnInit() {

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
  private fetchHeadlines() {
    const url = `https://newsapi.org/v2/top-headlines?country=il&apiKey=3ef38f994f794ecfbe563db621e56863`;
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
      return this.headlines[this.currentHeadlineIndex];
    }
    return { title: 'loading...', publishedAt: new Date() };
  }

}
