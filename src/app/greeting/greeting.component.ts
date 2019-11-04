import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { IdCard } from '../models';

@Component({
  selector: 'app-greeting',
  templateUrl: './greeting.component.html',
  styleUrls: ['./greeting.component.scss']
})
export class GreetingComponent implements OnInit, OnDestroy {
  now: Date;
  subscribe: Subscription;
  temperature: number;
  humidity: number;
  subscribeUpdateWeatherInterval: Subscription;
  swellHeight: any;
  swellPeriod: any;
  idCard: IdCard;
  greeting: string;
  wavesStars = 0;
  wavesMaxDummyStars = Array(5);
  weather: [{ icon: string, description: string, main: string }];
  constructor(private ref: ChangeDetectorRef, private dataService: DataService) {
    this.now = new Date();
    dataService.details.subscribe(details => {

      this.idCard = details;
      if (details.weatherAppId) {
        const clockTrack = interval(30 * 1000);

        this.subscribe = clockTrack.subscribe(val => {
          this.now = new Date();
        });
        const updateWeatherInterval = interval(1200 * 1000);
        this.subscribeUpdateWeatherInterval = updateWeatherInterval.subscribe(val => {
          this.fetchWeather();
          this.fetchWaveHeigth();
        });
        this.fetchWeather();
        this.fetchWaveHeigth();
      }
    });

  }

  private fetchWeather() {
    // tslint:disable-next-line:max-line-length
    this.dataService.getWeather()
      .subscribe((d: any) => {
        this.temperature = d.main.temp.toFixed(0);
        this.humidity = d.main.humidity.toFixed(0);
        this.weather = d.weather;
      });
  }


  private fetchWaveHeigth() {
    this.dataService.fetchWaveHeigth((d) => {
      this.swellHeight = d[0].swell.components.combined.height;
      this.swellPeriod = d[0].swell.components.combined.period;
      this.wavesStars = Number(Math.round(d[0].solidRating));
      this.ref.detectChanges();
    });
  }

  ngOnInit() { }
  ngOnDestroy(): void {
    this.subscribe.unsubscribe();
    this.subscribeUpdateWeatherInterval.unsubscribe();
  }

}
