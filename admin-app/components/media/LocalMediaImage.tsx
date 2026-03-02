import { useMemo, useState } from "react";

type LocalMediaImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
};

function toLocalPath(value?: string | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/media/")) return raw;
  if (raw.startsWith("/storage/")) return raw;
  return null;
}

function defaultAltText(): string {
  if (typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("th")) {
    return "รูปภาพอสังหา";
  }
  return "Property image";
}

export function LocalMediaImage({
  src,
  alt,
  className,
  fallbackSrc = "/media/placeholders/image-fallback.webp",
  width = 640,
  height = 360,
}: LocalMediaImageProps) {
  const preferred = useMemo(() => toLocalPath(src), [src]);
  const fallback = useMemo(
    () => toLocalPath(fallbackSrc) ?? "/media/placeholders/image-fallback.webp",
    [fallbackSrc]
  );
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 640;
  const safeHeight = Number.isFinite(height) && height > 0 ? Math.round(height) : 360;
  const resolvedAlt = useMemo(() => {
    const raw = String(alt ?? "").trim();
    return raw || defaultAltText();
  }, [alt]);
  const [currentSrc, setCurrentSrc] = useState<string>(preferred ?? fallback);

  return (
    <img
      className={className}
      src={currentSrc}
      alt={resolvedAlt}
      width={safeWidth}
      height={safeHeight}
      style={{ aspectRatio: `${safeWidth} / ${safeHeight}` }}
      loading="lazy"
      decoding="async"
      onError={() => {
        setCurrentSrc((previous) => (previous === fallback ? previous : fallback));
      }}
    />
  );
}
