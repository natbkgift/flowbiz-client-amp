import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AMP Pattaya — Real Estate Platform',
    short_name: 'AMP Pattaya',
    description: 'Discover, compare and invest in Pattaya condos with AI-powered smart finder.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a1a2e',
    icons: [
      { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
    ],
  };
}
