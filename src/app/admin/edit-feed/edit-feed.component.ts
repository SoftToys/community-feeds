import { Component, OnInit, Input } from '@angular/core';
import { FeedComponent } from 'src/app/feed/feed.component';
import { Feed } from 'src/app/feed/feed';
import { NgbActiveModal, NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { debug } from 'util';
import { Router } from '@angular/router';

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

  public feed: FeedNgb;
  days = [
    { id: 0, text: 'Sun' },
    { id: 1, text: 'Mon' },
    { id: 2, text: 'Tue' },
    { id: 3, text: 'Wed' },
    { id: 4, text: 'Thu' },
    { id: 5, text: 'Fri' },
    { id: 6, text: 'Sat' }
  ];
  imgTypes = [
    { id: 'Random', val: 'https://picsum.photos/900/700?random&t=2', customClass: '' },
    { id: 'Random Happiness', val: 'https://source.unsplash.com/collection/209138/900x700', customClass: '' },
    { id: 'Random Winter', val: 'https://source.unsplash.com/collection/3178572/900x700', customClass: '' },
    { id: 'Random Planets', val: 'https://source.unsplash.com/collection/894/900x700', customClass: '' },
    { id: 'Random mediterranean', val: 'https://source.unsplash.com/collection/8469893/900x700', customClass: '' },
    { id: 'Solid Black', val: 'https://dummyimage.com/900x700/000/000.png', customClass: '' },
    { id: 'Solid Grey', val: 'https://dummyimage.com/900x700/444/444.png', customClass: '' },
    { id: 'Solid White', val: 'https://dummyimage.com/900x700/fff/fff.png', customClass: '' },
    { id: 'Solid Green', val: 'https://dummyimage.com/900x700/099142/099142.png', customClass: '' },
    { id: 'Solid LightBlue', val: 'https://dummyimage.com/900x700/00b7ff/00b7ff.png', customClass: '' },
    { id: 'Art Picture', val: 'https://dummyimage.com/900x700/fff/fff.png', customClass: 'art-picture' },
    { id: 'Post it', val: 'https://dummyimage.com/900x700/fefe7e/fefe7e.png', customClass: 'post-it' },
    { id: 'Custom', val: '' },
  ];
  imgType: string;
  dropdownSettings: any;
  constructor(private router: Router) { }

  ngOnInit() {
    const empty = new Feed();
    let editItem = JSON.parse(localStorage.getItem('edit-item'));
    const routedFeed = window.history.state.data;
    if (routedFeed) {
      editItem = {};
    }
    this.feed = Object.assign(empty, editItem, routedFeed);
    localStorage.removeItem('edit-item');
    this.feed.ngbDateFrom = this.feed.validFromDate ? this.getDate(this.feed.validFromDate) : undefined;
    this.feed.ngbDateTo = this.feed.validToDate ? this.getDate(this.feed.validToDate) : undefined;
    this.imgType = this.getImageType(this.feed.imgSource, this.feed.customClass);
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
  getImageType(imgSource: string, customClass?: string): string {
    let type = 'Custom';
    if (imgSource) {
      const ind = this.imgTypes.findIndex((e) => e.val === imgSource && (customClass === e.customClass));
      if (ind >= 0) {
        type = this.imgTypes[ind].id;
      } else if (imgSource.includes('random')) {
        type = 'Random';
      }
    }
    return type;

  }
  selectImageType(selectedType: string) {
    switch (selectedType) {
      case 'Custom':
        this.feed.imgSource = '';
        this.feed.customClass = '';
        break;
      case 'Random':
        this.feed.imgSource = `https://picsum.photos/900/700?random&t=${new Date().getTime() % 10}`;
        this.feed.customClass = '';
        break;
      default:
        const ind = this.imgTypes.findIndex((e) => e.id === selectedType);
        if (ind >= 0) {
          this.feed.imgSource = this.imgTypes[ind].val;
          this.feed.customClass = this.imgTypes[ind].customClass || '';
        } else {
          this.feed.imgSource = '';
          this.feed.customClass = '';
        }
        break;
    }
  }
  getDate(d: string): NgbDateStruct {
    const tokens = d.split('/');
    return { year: Number(tokens[2]), month: Number(tokens[1]), day: Number(tokens[0]) };
  }
  get shownTimeDescription(): string {

    if (this.feed.day && this.feed.day.length > 0) {
      // tslint:disable:max-line-length
      return `Will be shown on ${this.feed.day[0].text} at ${this.feed.fromHour || '00'}:00 till ${this.feed.day[this.feed.day.length - 1].text} at ${this.feed.tillHour ? this.feed.tillHour.toString() + ':00' : 'end of day'}`;
    } else if (this.feed.fromHour) {
      return `Will be shown every day at ${this.feed.fromHour || '00'}:00 till ${this.feed.tillHour ? this.feed.tillHour.toString() + ':00' : 'end of day'}`;
    }
    return '';
  }
  onFromDateSelect(e: NgbDate) {
    this.feed.validFromDate = `${e.day}/${e.month}/${e.year}`;
  }
  onTillDateSelect(e: NgbDate) {
    this.feed.validToDate = `${e.day}/${e.month}/${e.year}`;
  }
  showPreview() {
    localStorage.setItem('edit-item', JSON.stringify(this.feed));
    this.router.navigate(['feed'], { state: { demoFeed: this.feed } });
  }
  save() {
    this.router.navigate(['admin'], { state: { data: this.feed } });
  }
}
