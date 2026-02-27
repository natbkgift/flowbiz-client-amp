import { LocalMediaImage } from "./LocalMediaImage";

type SafeCoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function SafeCoverImage({ src, alt, className }: SafeCoverImageProps) {
  return (
    <LocalMediaImage
      src={src}
      alt={alt}
      className={className}
      fallbackSrc="/media/placeholders/property-cover.webp"
    />
  );
}
