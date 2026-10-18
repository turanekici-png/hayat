// Site icindeki JPG/PNG/WebP gorselleri Next.js'in yerlesik gorsel optimizasyonundan
// (/_next/image) gecirir: tarayiciya ekran boyutuna gore kucultulmus WebP/AVIF gider,
// sonuc .next/cache/images altinda onbelleklenir. Video, GIF, SVG, data:/blob: ve
// dis adresler oldugu gibi birakilir.
// Acil durumda NEXT_PUBLIC_IMAGE_OPTIMIZATION="off" ile (build sirasinda) kapatilabilir.

const optimizableImagePattern = /\.(jpe?g|png|webp|avif)$/i;

// next.config.ts icindeki deviceSizes/imageSizes listesinde olmali.
export type ImageWidth = 256 | 384 | 640 | 828 | 1080 | 1200 | 1920;

const optimizationEnabled = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION !== "off";

function canOptimize(src: string) {
  if (!optimizationEnabled) return false;
  if (!src.startsWith("/") || src.startsWith("//") || src.startsWith("/_next/")) return false;
  const pathname = src.split(/[?#]/)[0];
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Bozuk kodlanmis adreste orijinal yol kullanilir.
  }
  return optimizableImagePattern.test(decoded);
}

export function optimizedImageSrc<T extends string | null | undefined>(src: T, width: ImageWidth): T | string {
  if (!src || !canOptimize(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function optimizedImageSrcSet(src: string | null | undefined, widths: ImageWidth[]) {
  if (!src || !canOptimize(src)) return undefined;
  return widths.map((width) => `${optimizedImageSrc(src, width)} ${width}w`).join(", ");
}
