"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { LuFileText as FileText,LuLoaderCircle as Loader2 } from "react-icons/lu";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
}

interface PdfThumbnailProps {
  url: string;
}

export default function PdfThumbnail({ url }: PdfThumbnailProps) {
  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden bg-zinc-50">
      <Document
        file={`/api/proxy-pdf?url=${encodeURIComponent(url)}`}
        loading={<Loader2 className="h-5 w-5 animate-spin text-zinc-400" />}
        error={<FileText className="text-brand-blue h-10 w-10 opacity-50" />}
      >
        <Page pageNumber={1} width={140} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    </div>
  );
}
