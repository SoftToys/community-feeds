import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { interval } from 'rxjs';
import { HttpClient, JsonpClientBackend } from '@angular/common/http';
import { DataService } from '../data.service';
import { IdCard } from '../details';

@Component({
  selector: 'app-greeting',
  templateUrl: './greeting.component.html',
  styleUrls: ['./greeting.component.scss']
})
export class GreetingComponent implements OnInit {
  now: Date;
  subscribe: any;
  temperature: number;
  humidity: number;
  subscribeUpdateWeatherInterval: any;
  swellHeight: any;
  swellPeriod: any;
  idCard: IdCard;
  greeting: string;
  wavesStars = [];
  constructor(private http: HttpClient, private ref: ChangeDetectorRef, private dataService: DataService) {
    this.now = new Date();
    dataService.details.subscribe(details => {

      this.idCard = details;
      if (details.weatherAppId) {
        const changeAtricle = interval(30 * 1000);
        this.subscribe = changeAtricle.subscribe(val => {
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
    this.http.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.idCard.location}&appid=${this.idCard.weatherAppId}&units=metric`)
      .subscribe((d: any) => {
        this.temperature = d.main.temp.toFixed(0);
        this.humidity = d.main.humidity.toFixed(0);
      });
  }


  private fetchWaveHeigth() {
    const callback = `waves_${new Date().getTime()}`;
    // tslint:disable-next-line:max-line-length
    this.jsonp(`https://magicseaweed.com/api/${this.idCard.magicSeaWeedKey}/forecast/?spot_id=${this.idCard.magicSeaWeedSpot}&callback=${callback}`,
      (d) => {
        this.swellHeight = d[0].swell.components.combined.height;
        this.swellPeriod = d[0].swell.components.combined.period;
        this.wavesStars = d[0].solidRating > 0 ? Array(d[0].solidRating) : [];
        this.ref.detectChanges();
      }, callback);
  }

  public jsonp(url: string, callback: (r: any) => any, callbackName: string) {
    url = url || '';
    const generatedFunction = callbackName;

    window[generatedFunction] = (json) => {
      callback(json);

      try {
        delete window[generatedFunction];
      } catch (e) { }

    };

    if (url.indexOf('?') === -1) { url = url + '?'; } else { url = url + '&'; }
    // 5 - //not using element.setAttribute()
    const jsonpScript = document.createElement('script');
    jsonpScript.src = url + 'callback=' + generatedFunction;
    jsonpScript.type = 'text/javascript';
    jsonpScript.className = 'cross';
    jsonpScript.async = true;
    document.getElementsByTagName('head')[0].appendChild(jsonpScript);
  }

  ngOnInit() {
  }

}
