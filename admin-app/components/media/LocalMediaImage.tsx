import { useMemo, useState } from "react";

type LocalMediaImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

function toLocalPath(value?: string | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/media/")) return raw;
  if (raw.startsWith("/storage/")) return raw;
  return null;
}

export function LocalMediaImage({
  src,
  alt,
  className,
  fallbackSrc = "/media/placeholders/image-fallback.webp",
}: LocalMediaImageProps) {
  const preferred = useMemo(() => toLocalPath(src), [src]);
  const fallback = useMemo(() => toLocalPath(fallbackSrc) ?? "/media/placeholders/image-fallback.webp", [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState<string>(preferred ?? fallback);

  return (
    <img
      className={className}
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => setCurrentSrc(fallback)}
    />
  );
}
