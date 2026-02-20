import Image from 'next/image';

function allowedHosts(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '';
  const hosts = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return new Set(hosts);
}

function hostnameOf(src: string): string | null {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

export function RemoteImage({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}) {
  const isRemote = /^https?:\/\//i.test(src);
  const hosts = allowedHosts();
  const host = isRemote ? hostnameOf(src) : null;
  const canOptimize = !isRemote || (host ? hosts.has(host) : false);

  if (canOptimize) {
    return <Image src={src} alt={alt} className={className} width={width} height={height} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
