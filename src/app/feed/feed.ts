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
    this.day = [];
  }
  tillHour?: number;
  fromHour?: number;
  isActive: boolean;
  day?: { id: number, text: string }[];
  imgSource?: string;
  mainText?: string;
  time?: Date;
  subText?: string;
  subImgSource?: string;
  validFromDate?: string;
  validToDate?: string;
  customClass?: string;
}
