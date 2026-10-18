import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Prisma kullanıyorsanız standalone deploy'da faydalı olur.
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
      './prisma/**/*',
      './public/**/*'
    ]
  },
  reactStrictMode: true,
  // Gorseller /_next/image uzerinden kucultulup WebP olarak sunulur (bkz. lib/image-src.ts).
  // Medya adresleri her yuklemede degistigi (id + dosya adi) icin uzun onbellek guvenlidir.
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30
  },
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ["10.0.0.183"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb"
    }
  },

  // Icerik sayfalari (bagis/basvuru/admin haric) icin Cache-Control basligi.
  // Sunucu (Next.js "force-dynamic") her istekte yeniden render eder ama
  // Cloudflare gibi bir CDN onunde varsa bu baslik sayesinde kisa sureligine
  // kenarda (edge) onbelleklenebilir. DB erisimi/derleme zamani gerektirmez,
  // build'i etkilemez - sadece yanit basligini degistirir.
  async headers() {
    const cacheControl = { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" };
    const cacheablePaths = [
      "/",
      "/haberler",
      "/haberler/:id",
      "/galeri",
      "/projeler",
      "/kurumsal",
      "/faaliyetler",
      "/faaliyetler/:id",
      "/duyurular/:id",
      "/kvkk",
      "/hesap-numaralarimiz",
      "/iade-politikasi",
      "/kullanim-kosullari-ve-gizlilik-politikasi",
      "/cerez-politikasi"
    ];
    return cacheablePaths.map((source) => ({ source, headers: [cacheControl] }));
  }
};

export default nextConfig;
