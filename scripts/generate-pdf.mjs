import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function convertHtmlToPdf(htmlPath, pdfPath) {
  const absoluteHtml = path.resolve(htmlPath);
  const absolutePdf = path.resolve(pdfPath);
  const fileUrl = "file:///" + absoluteHtml.replace(/\\/g, "/");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

  const binary = fs.existsSync(chromePath) ? chromePath : edgePath;

  execFileSync(binary, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--print-to-pdf=${absolutePdf}`,
    "--no-pdf-header-footer",
    fileUrl,
  ]);

  if (fs.existsSync(absolutePdf)) {
    const stats = fs.statSync(absolutePdf);
    console.log(`[PDF Generator] Created ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    return true;
  }
  return false;
}

if (process.argv[1]?.endsWith("generate-pdf.mjs") && process.argv.length > 3) {
  convertHtmlToPdf(process.argv[2], process.argv[3]);
}
