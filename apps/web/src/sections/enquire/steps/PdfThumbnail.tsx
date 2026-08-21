"use client";

import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
}

interface PdfThumbnailProps {
  url: string;
}

export default function PdfThumbnail({ url }: PdfThumbnailProps) {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center bg-zinc-50 pointer-events-none">
      <Document
        file={`/api/proxy-pdf?url=${encodeURIComponent(url)}`}
        loading={<Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
        error={<FileText className="w-10 h-10 opacity-50 text-brand-blue" />}
      >
        <Page
          pageNumber={1}
          width={140}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
