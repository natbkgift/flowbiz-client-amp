/** @type {import('next').NextConfig} */
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  trailingSlash: true,
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
        // Security headers for all routes (Blueprint doc 16)
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
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
      // Blueprint doc 03 — INDEX MATRIX: admin/auth pages are always noindex.
      // These are 'use client' pages that cannot export Next.js metadata, so we
      // use the X-Robots-Tag response header instead.
      {
        source: '/login',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/leads',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/leads/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/inquiries',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/inquiries/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/analytics',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/analytics/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  // Blueprint doc 02 — URL STRUCTURE: 301 redirects for old/renamed slugs.
  // Add entries here when a project, area, or page slug changes.
  async redirects() {
    return [
      // Example:
      // { source: '/:locale/projects/old-project-name/', destination: '/:locale/projects/new-project-name/', permanent: true },
    ];
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
