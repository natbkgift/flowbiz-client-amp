import { LocalMediaImage } from "./LocalMediaImage";

type SafeCoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
};

export function SafeCoverImage({ src, alt, className, width, height }: SafeCoverImageProps) {
  return (
    <LocalMediaImage
      src={src}
      alt={alt}
      className={className}
      fallbackSrc="/media/placeholders/property-cover.webp"
      width={width}
      height={height}
    />
  );
}
