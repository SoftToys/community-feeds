import { Component, OnInit, Input } from '@angular/core';
import { FeedComponent } from 'src/app/feed/feed.component';
import { Feed } from 'src/app/feed/feed';
import { NgbActiveModal, NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { debug } from 'util';

export class FeedNgb extends Feed {
  ngbDateFrom: NgbDateStruct;
  ngbDateTo: NgbDateStruct;
}

@Component({
  selector: 'app-edit-feed',
  templateUrl: './edit-feed.component.html',
  styleUrls: ['./edit-feed.component.scss']
})
export class EditFeedComponent implements OnInit {

  @Input() public feed: FeedNgb;
  days = [
    { id: 0, text: 'Sun' },
    { id: 1, text: 'Mon' },
    { id: 2, text: 'Tue' },
    { id: 3, text: 'Wed' },
    { id: 4, text: 'Thu' },
    { id: 5, text: 'Fri' },
    { id: 6, text: 'Sat' }

  ];
  dropdownSettings: any;
  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    const empty = new Feed();
    this.feed = Object.assign(empty, this.feed);
    this.feed.ngbDateFrom = this.feed.validFromDate ? this.getDate(this.feed.validFromDate) : undefined;
    this.feed.ngbDateTo = this.feed.validToDate ? this.getDate(this.feed.validToDate) : undefined;
    this.dropdownSettings = {
      enableCheckAll: false,
      data: this.days,
      singleSelection: false,
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 6,
      allowSearchFilter: false
    };
  }
  getDate(d: string): NgbDateStruct {
    const tokens = d.split('/');
    return { year: Number(tokens[2]), month: Number(tokens[1]), day: Number(tokens[0]) };
  }
  get shownTimeDescription(): string {
    if (this.feed.day && this.feed.day.length > 0) {
      // tslint:disable-next-line:max-line-length
      return `Will be shown on ${this.feed.day[0].text} at ${this.feed.fromHour || '00'}:00 till ${this.feed.day[this.feed.day.length - 1].text} at ${this.feed.tillHour ? this.feed.tillHour.toString() + ':00' : 'end of day'}`;
    }
    return '';
  }
  onFromDateSelect(e: NgbDate) {
    // (this.feed as any).ngbDateFrom = e;
    this.feed.validFromDate = `${e.day}/${e.month}/${e.year}`;
  }
  onTillDateSelect(e: NgbDate) {
    // (this.feed as any).ngbDateTo = e;
    this.feed.validToDate = `${e.day}/${e.month}/${e.year}`;
  }
  save() {
    this.activeModal.close(this.feed);
  }
}



// }

// onSelectAll(items: any) {
//   console.log(items);
// }

// }
