import { Certificate, SisterCompany } from "@types";

export type { Certificate, SisterCompany };

export const certificates: Certificate[] = [
  {
    name: "ISO 9001",
    code: "ISO - 9001 - 2008",
    image: "/certificate/tuv.png",
  },
  {
    name: "ISO 14001",
    code: "ISO - 14001 - 2004",
    image: "/certificate/jas-anz-14001.png",
  },
  {
    name: "OHSAS 18001",
    code: "OHSAS - 18001 - 2007",
    image: "/certificate/jas-anz-18001.png",
  },
  {
    name: "IAF",
    code: "Member of Multilateral",
    image: "/certificate/iaf.png",
  },
];

export const sisterCompanies: SisterCompany[] = [
  {
    name: "Paanayil Heavy",
    img: "/images/concern-companies/paanayil-heavy.png",
  },
  {
    name: "Paanayil Builder",
    img: "/images/concern-companies/panayil-builder.png",
  },
  {
    name: "South Pacific General",
    img: "/images/concern-companies/south-pacific-general.png",
  },
];

export const concernLogos = Array.from(
  { length: 7 },
  (_, i) => `/images/concern-companies/logos/${i + 1}.png`
);
