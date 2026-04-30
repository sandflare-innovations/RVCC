export interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  edition: string;
}

export const NEWS_DATA: NewsItem[] = [
  {
    id: "01",
    title: "Community Landmark: The Lakes Park Project",
    date: "April 15, 2024",
    excerpt:
      "A new standard for urban recreation. Our latest community project at Lakes Park reflects our commitment to sustainable public spaces.",
    image: "/images/news/lakes-park.png",
    category: "COMMUNITY DEVELOPMENT",
    edition: "Vol. 24 / Issue 02",
  },
  {
    id: "02",
    title: "Supportive Spirit: RVCC Cricket Auction",
    date: "April 10, 2024",
    excerpt:
      "Empowering local sports through community-driven initiatives. The annual cricket auction continues to foster athletic talent in the region.",
    image: "/images/news/cricket-auction.png",
    category: "SPORTS ENGAGEMENT",
    edition: "Vol. 24 / Issue 01",
  },
  {
    id: "03",
    title: "Athletic Excellence: Riyadh Football Cup",
    date: "March 20, 2024",
    excerpt:
      "Celebrating teamwork and precision. Our sponsorship of the local football championship highlights our dedication to youth empowerment.",
    image: "/images/news/football-match.png",
    category: "SPORTS SPONSORSHIP",
    edition: "Vol. 24 / Issue 03",
  },
];
