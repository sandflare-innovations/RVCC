import { Certificate, SisterCompany } from "@types";

export type { Certificate, SisterCompany };

export const certificates: Certificate[] = [
  {
    name: "ISO 9001",
    code: "ISO - 9001 - 2008",
    image: "/images/certificate/tuv.webp",
  },
  {
    name: "ISO 14001",
    code: "ISO - 14001 - 2004",
    image: "/images/certificate/jas-anz-14001.webp",
  },
  {
    name: "OHSAS 18001",
    code: "OHSAS - 18001 - 2007",
    image: "/images/certificate/jas-anz-18001.webp",
  },
  {
    name: "IAF",
    code: "Member of Multilateral",
    image: "/images/certificate/iaf.webp",
  },
];

export const sisterCompanies: SisterCompany[] = [
  {
    name: "Paanayil Heavy",
    img: "/images/concern-companies/paanayil-heavy.webp",
  },
  {
    name: "Paanayil Builder",
    img: "/images/concern-companies/panayil-builder.webp",
  },
  {
    name: "South Pacific General",
    img: "/images/concern-companies/south-pacific-general.webp",
  },
];

export interface ConcernLogo {
  src: string;
  href?: string;
}

const concernLogoLinks: Record<number, string> = {
  1: "https://www.flyinco.com/",
};

export const concernLogos: ConcernLogo[] = Array.from({ length: 9 }, (_, i) => ({
  src: `/images/concern-companies/logos/${i + 1}.webp`,
  href: concernLogoLinks[i + 1],
}));
