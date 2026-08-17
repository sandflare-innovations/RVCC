import { groq } from "next-sanity";

export const GET_FEATURES_QUERY = groq`*[_type == "feature"] {
  _id,
  title,
  description,
  "icon": icon.name,
  "color": icon.color
}`;

export const GET_HERO_QUERY = groq`*[_type == "hero"][0] {
  title,
  subtitle,
  ctaText,
  "backgroundImage": backgroundImage.asset->url
}`;
