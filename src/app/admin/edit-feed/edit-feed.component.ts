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
  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    const empty = new Feed();
    this.feed = Object.assign(empty, this.feed);
    this.feed.ngbDateFrom = this.feed.validFromDate ? this.getDate(this.feed.validFromDate) : undefined;
    this.feed.ngbDateTo = this.feed.validToDate ? this.getDate(this.feed.validToDate) : undefined;
  }
  getDate(d: string): NgbDateStruct {
    const tokens = d.split('/');
    return { year: Number(tokens[2]), month: Number(tokens[1]), day: Number(tokens[0]) };
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
