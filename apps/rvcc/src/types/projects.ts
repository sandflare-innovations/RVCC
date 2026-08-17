export interface WorkItem {
  id: number;
  title1: string;
  title2: string;
  description: string;
  image: string;
  number: string;
  cta: string;
  iconId: string;
}

export interface MajorProjectItem {
  id: string;
  title: string;
  location: string;
  image: string;
  description: string;
}

export interface RecentProjectItem {
  title: string;
  location: string;
  year: string;
  category: string;
  type: string;
  description: string;
  image: string;
}
