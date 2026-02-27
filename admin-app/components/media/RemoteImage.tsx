import Image from 'next/image';

function allowedHosts(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '';
  const hosts = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return new Set(['amppattaya.com', 'www.amppattaya.com', ...hosts]);
}

function hostnameOf(src: string): string | null {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

/** Tiny 1x1 transparent PNG used as blur placeholder. */
const blurDataURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk20jQ5QAAAABJRU5ErkJggg==';

export function RemoteImage({
  src,
  alt,
  className,
  width,
  height,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  loading = 'lazy',
}: {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}) {
  const safeSrc = src.trim();
  if (!safeSrc) return null;

  const isRemote = /^https?:\/\//i.test(safeSrc);
  const hosts = allowedHosts();
  const host = isRemote ? hostnameOf(safeSrc) : null;
  const canOptimize = !isRemote || (host ? hosts.has(host) : false);

  if (canOptimize) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        placeholder="blur"
        blurDataURL={blurDataURL}
      />
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={sizes}
      loading={loading}
      decoding="async"
    />
  );
}
