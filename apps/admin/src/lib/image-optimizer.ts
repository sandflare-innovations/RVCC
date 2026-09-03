/**
 * Client-side lossless/high-fidelity image optimizer for client logos and artwork.
 * Converts uploaded images (PNG, JPEG, WebP) to WebP format while preserving transparency
 * and sharpness at 0.98 quality without reducing perceptual clarity.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.98 for maximum fidelity)
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ file: File; dataUrl: string; width: number; height: number }> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 0.98 } = options;

  // If already a webp and reasonably sized, return as is
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain original aspect ratio, constrain only if exceeding bounds
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) {
          // Fallback if canvas context fails
          return resolve({
            file,
            dataUrl: readerEvent.target?.result as string,
            width: img.width,
            height: img.height,
          });
        }

        // Enable highest quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                dataUrl: readerEvent.target?.result as string,
                width,
                height,
              });
            }

            const dotIdx = file.name.lastIndexOf(".");
            const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
            const optimizedFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL("image/webp", quality);
            resolve({
              file: optimizedFile,
              dataUrl,
              width,
              height,
            });
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for optimization."));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
