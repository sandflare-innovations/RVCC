import fs from "fs";
import path from "path";
import glob from "glob"; // we can just use native recursive readdir or similar. Let's use simple node api

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walkDir("apps/admin/src");

let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Only target the main flex-1 overflow-y-auto divs that represent page containers
  if (content.includes("flex-1") && content.includes("overflow-y-auto")) {
    let newContent = content.replace(
      /<div className="(.*?flex-1.*?overflow-y-auto.*?)">/g,
      (match, p1) => {
        // Exclude specific local modals/dropdowns if needed
        if (p1.includes("max-h-")) return match; 
        
        // Remove overflow-y-auto and scrollbar hiding classes, as SmoothScroll handles it
        let newClasses = p1
          .replace(/overflow-y-auto/g, "")
          .replace(/\[&::-webkit-scrollbar\]:hidden/g, "")
          .replace(/\[-ms-overflow-style:none\]/g, "")
          .replace(/\[scrollbar-width:none\]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        
        return `<SmoothScroll className="${newClasses}">`;
      }
    );

    // Also replace the closing div. This is tricky with regex, but if we do it manually for the top-level files:
    // It's safer to just do manual edits for the 4 main ones.
  }
});
