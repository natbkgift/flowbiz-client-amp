/** @type {import('next').NextConfig} */
const path = require('node:path');
const useMinimalConfig = process.env.NEXT_LOCAL_CONFIG_MINIMAL === '1';
const localDistDir = process.env.NEXT_LOCAL_DIST_DIR?.trim();
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

function normalizeAbsoluteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function resolveApiRewriteBase() {
  return (
    normalizeAbsoluteUrl(process.env.LOCAL_API_ORIGIN) ||
    normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_API_BASE) ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : null)
  );
}

function resolveMediaRewriteBase(apiRewriteBase) {
  const explicitMediaOrigin = normalizeAbsoluteUrl(process.env.LOCAL_MEDIA_ORIGIN);
  if (explicitMediaOrigin) return explicitMediaOrigin;
  if (!apiRewriteBase) return null;
  try {
    return new URL(apiRewriteBase).origin;
  } catch {
    return null;
  }
}

const nextConfig = {
  reactStrictMode: true,
  distDir: localDistDir || '.next',
  output: useMinimalConfig ? undefined : 'standalone',
  poweredByHeader: false,
  compress: true,
  skipTrailingSlashRedirect: true,
  images: useMinimalConfig ? undefined : {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 72, 75, 76],
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
    const apiRewriteBase = resolveApiRewriteBase();
    const mediaRewriteBase = resolveMediaRewriteBase(apiRewriteBase);
    if (!apiRewriteBase && !mediaRewriteBase) return [];

    const beforeFiles = [];
    const afterFiles = [];
    if (apiRewriteBase) {
      afterFiles.push(
        // Local preview parity with the deployed edge proxy:
        // LOCAL_API_ORIGIN may point either at a backend root (e.g. localhost:8000)
        // or a site-prefixed API origin (e.g. https://amppattaya.com/api).
        // NEXT_PUBLIC_API_BASE may also provide the absolute upstream base during standalone QA.
        // Keep sanitized public platform endpoints inside Next route handlers.
        { source: '/api/:path((?!platform/version(?:/)?$|platform/deploy-history(?:/)?$|media(?:/|$)).*)', destination: `${apiRewriteBase}/:path` },
      );
    }
    if (mediaRewriteBase) {
      beforeFiles.push(
        // Media paths often end with real file extensions, so this rewrite must run
        // before filesystem/public-file resolution in standalone QA and local preview.
        { source: '/media/:path*', destination: `${mediaRewriteBase}/media/:path*` },
      );
    }

    return {
      beforeFiles,
      afterFiles,
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
