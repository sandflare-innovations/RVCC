export interface HeroSlideItem {
  id: string;
  badge?: string;
  title1: string;
  title2: string;
  description: string;
  imageUrl: string;
  primaryBtnText?: string | null;
  primaryBtnLink?: string | null;
  secondaryBtnText?: string | null;
  secondaryBtnLink?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
