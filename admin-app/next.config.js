/** @type {import('next').NextConfig} */
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
    // Serve optimized images from edge cache
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  async headers() {
    return [
      {
        // CDN + browser caching for static assets
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Optimized images: cache for 1 hour at CDN
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];

    const devApiOrigin = process.env.LOCAL_API_ORIGIN || 'http://127.0.0.1:8000';
    return {
      fallback: [
        // Local dev parity with production nginx:
        // /api/* on frontend should hit backend root (without /api prefix).
        { source: '/api/:path*', destination: `${devApiOrigin}/:path*` },
        // If a /media file is missing in Next public/, fall through to backend media mount.
        { source: '/media/:path*', destination: `${devApiOrigin}/media/:path*` },
      ],
    };
  },
};

// Bundle analysis: run `ANALYZE=true npm run build` to generate reports.
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
    module.exports = withBundleAnalyzer(nextConfig);
  } catch {
    // @next/bundle-analyzer is an optional devDependency.
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
