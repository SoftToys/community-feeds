export interface Feed {
  tillHour: number;
  fromHour?: number;
  isActive: boolean;
  day?: number[];
  imgSource: string;
  mainText: string;
  time: Date;
  subText: string;
  subImgSource: string;
  validFromDate: Date;
  validToDate: Date;
}
