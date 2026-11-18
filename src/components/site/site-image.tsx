import type { PublicImage } from "@/server/content/media";

/**
 * A pre-resized image (AVIF/WebP variants from the media pipeline) as a plain <picture>.
 * No next/image: the variants already exist, so re-optimising would only spend image quota.
 */
export function SiteImage({
  image,
  sizes,
  className = "",
  priority = false,
}: {
  image: PublicImage;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      {image.avifSrcSet && <source type="image/avif" srcSet={image.avifSrcSet} sizes={sizes} />}
      {image.webpSrcSet && <source type="image/webp" srcSet={image.webpSrcSet} sizes={sizes} />}
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
        style={
          image.blurData
            ? { backgroundImage: `url(${image.blurData})`, backgroundSize: "cover" }
            : undefined
        }
      />
    </picture>
  );
}
