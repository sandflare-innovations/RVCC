import { Certificate, SisterCompany } from "@types";

export type { Certificate, SisterCompany };

export const certificates: Certificate[] = [
  {
    name: "ISO 9001",
    code: "ISO - 9001 - 2008",
    image: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/certificates/iso-9001-tuv-01fd.webp",
  },
  {
    name: "ISO 14001",
    code: "ISO - 14001 - 2004",
    image: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/certificates/iso-14001-jas-anz-o0ed.webp",
  },
  {
    name: "OHSAS 18001",
    code: "OHSAS - 18001 - 2007",
    image: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/certificates/ohsas-18001-jas-anz-5co8.webp",
  },
  {
    name: "IAF",
    code: "Member of Multilateral",
    image: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/certificates/iaf-multilateral-e0ul.webp",
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

