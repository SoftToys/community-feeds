import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { interval } from 'rxjs';
import { HttpClient, JsonpClientBackend } from '@angular/common/http';

@Component({
  selector: 'app-greeting',
  templateUrl: './greeting.component.html',
  styleUrls: ['./greeting.component.scss']
})
export class GreetingComponent implements OnInit {
  now: Date;
  subscribe: any;
  greeting: string;
  location: string;
  weatherAppId: string;
  temperature: number;
  humidity: number;
  subscribeUpdateWeatherInterval: any;
  magicSeaWeedKey: string;
  magicSeaWeedSpot: number;
  swellHeight: any;
  swellPeriod: any;
  constructor(private http: HttpClient, private jsonpHttp: JsonpClientBackend, private ref: ChangeDetectorRef) {
    this.greeting = 'אריק לביא 1';
    this.location = 'Netanya,il';
    this.now = new Date();
    this.weatherAppId = '5e6688a21dfb2d2d8e7b4b57b0e88534';
    this.magicSeaWeedKey = 'af5ebfb429b64e6c70f8cd3b38a8760a';
    this.magicSeaWeedSpot = 4558;

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

  private fetchWeather() {
    this.http.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.location}&appid=${this.weatherAppId}&units=metric`)
      .subscribe((d: any) => {
        this.temperature = d.main.temp.toFixed(0);
        this.humidity = d.main.humidity.toFixed(0);
      });
  }


  private fetchWaveHeigth() {
    const callback = `waves_${new Date().getTime()}`;
    this.jsonp(`https://magicseaweed.com/api/${this.magicSeaWeedKey}/forecast/?spot_id=${this.magicSeaWeedSpot}&callback=${callback}`,
      (d) => {
        this.swellHeight = d[0].swell.components.combined.height;
        this.swellPeriod = d[0].swell.components.combined.period;
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
