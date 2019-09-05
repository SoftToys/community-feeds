import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  inputTenantId: string;
  constructor(public dataService: DataService) {

  }

  ngOnInit() {
  }

  public setTenant() {
    this.dataService.setTenant(this.inputTenantId);
  }
}
