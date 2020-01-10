import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { IdCard } from '../models';


const MS_IN_DAY = 24 * 60 * 60 * 1000;
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
  nextSwellInDays: number;
  showSnow: boolean;
  constructor(private ref: ChangeDetectorRef, private dataService: DataService) {
    this.now = new Date();
    dataService.details.subscribe(details => {

      this.idCard = details;
      if (details.weatherAppId) {
        const clockTrack = interval(30 * 1000);

        this.subscribe = clockTrack.subscribe(val => {
          this.now = new Date();
        });
        const updateWeatherInterval = interval(3600 * 1000);
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
        this.showSnow = this.temperature < 15;
      });
  }


  private fetchWaveHeigth() {
    this.dataService.fetchWaveHeigth((d) => {
      const nextWavesForecastIndex = d.findIndex((w) => {
        return w.localTimestamp > (new Date().getTime() / 1000);
      });
      const index = nextWavesForecastIndex >= 0 ? nextWavesForecastIndex : 0;
      this.swellHeight = d[index].swell.components.combined.height;
      this.swellPeriod = d[index].swell.components.combined.period;
      this.wavesStars = Number(Math.round(d[index].solidRating));

      const nextSwellAheadIndex = d.findIndex((w) => {
        return w.localTimestamp > (new Date().getTime() / 1000) &&
          w.solidRating > 0;
      });

      this.nextSwellInDays = -1;
      if (nextSwellAheadIndex > -1) {
        this.nextSwellInDays = Math.round(((d[nextSwellAheadIndex].localTimestamp * 1000) - new Date().getTime()) / MS_IN_DAY);
      }

      this.ref.detectChanges();
    });
  }

  ngOnInit() { }
  ngOnDestroy(): void {
    this.subscribe.unsubscribe();
    this.subscribeUpdateWeatherInterval.unsubscribe();
  }

}
