export class Feed {
  /**
   *
   */
  constructor() {
    this.isActive = true;
    this.imgSource = '';
    this.subText = '';
    this.mainText = '';
    this.subImgSource = '';
  }
  tillHour?: number;
  fromHour?: number;
  isActive: boolean;
  day?: number[];
  imgSource?: string;
  mainText?: string;
  time?: Date;
  subText?: string;
  subImgSource?: string;
  validFromDate?: string;
  validToDate?: string;
}
