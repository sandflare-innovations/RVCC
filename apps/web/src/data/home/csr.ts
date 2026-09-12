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
    img: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/sister-concerns/paanayil-heavy-8dci.webp",
  },
  {
    name: "Paanayil Builder",
    img: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/sister-concerns/panayil-builder-l5gr.webp",
  },
  {
    name: "South Pacific General",
    img: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/sister-concerns/south-pacific-general-pnpm.webp",
  },
];

