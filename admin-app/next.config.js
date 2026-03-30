/** @type {import('next').NextConfig} */
const path = require('node:path');
const useMinimalConfig = process.env.NEXT_LOCAL_CONFIG_MINIMAL === '1';
const localDistDir = process.env.NEXT_LOCAL_DIST_DIR?.trim();
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  distDir: localDistDir || '.next',
  output: useMinimalConfig ? undefined : 'standalone',
  poweredByHeader: false,
  compress: true,
  skipTrailingSlashRedirect: true,
  images: useMinimalConfig ? undefined : {
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
  async headers() {
    if (useMinimalConfig) return [];
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
    if (useMinimalConfig) return [];
    const localApiOrigin =
      process.env.LOCAL_API_ORIGIN ||
      (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : '');
    const localMediaOrigin = process.env.LOCAL_MEDIA_ORIGIN || localApiOrigin;
    if (!localApiOrigin) return [];

    return {
      afterFiles: [
        // Local preview parity with the deployed edge proxy:
        // LOCAL_API_ORIGIN may point either at a backend root (e.g. localhost:8000)
        // or a site-prefixed API origin (e.g. https://amppattaya.com/api).
        // Keep sanitized public platform endpoints inside Next route handlers.
        { source: '/api/:path((?!platform/version(?:/)?$|platform/deploy-history(?:/)?$).*)', destination: `${localApiOrigin}/:path` },
        // Allow media to use a separate origin when API and site/media are hosted differently.
        { source: '/media/:path*', destination: `${localMediaOrigin}/media/:path*` },
      ],
    };
  },
  webpack(config) {
    if (useMinimalConfig) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@/app/root-styles': path.join(__dirname, 'app', 'root-styles-empty.ts'),
        '@/app/root-fonts': path.join(__dirname, 'app', 'root-fonts-fallback.ts'),
      };
    }
    return config;
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
