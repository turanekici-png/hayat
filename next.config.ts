import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Prisma kullanıyorsanız standalone deploy'da faydalı olur.
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/**/*',
      './prisma/**/*'
    ]
  },
  reactStrictMode: true,
  allowedDevOrigins: ["10.0.0.183"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb"
    }
  }
};

export default nextConfig;
