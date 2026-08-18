export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  edition: string;
}

export interface AboutStat {
  value: number;
  label: string;
  suffix: string;
}
