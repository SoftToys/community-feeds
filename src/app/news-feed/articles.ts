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
  publishedAt?: Date;
  content?: string;
}
export interface Source {
  id?: string | null;
  name: string;
}
