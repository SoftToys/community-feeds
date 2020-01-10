export class IdCard {
  greeting: string;
  location: string;
  weatherAppId: string;
  magicSeaWeedKey: string;
  magicSeaWeedSpot: number;
  newsApiKey: string;
  wavesSpot: string;
  weatherEffects: boolean;
}

export interface Articles {
  status: string;
  totalResults: number;
  articles?: (ArticleEntity)[] | null;
}
export interface ArticleEntity {
  source?: Source;
  author?: string | null;
  title: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
  publishedAtUtc?: Date;
}
export interface Source {
  id?: string | null;
  name: string;
}
