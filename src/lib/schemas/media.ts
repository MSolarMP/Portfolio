import { z } from "zod";
import { optionalText } from "./fields";

/** Image types the vault accepts. The server also checks the file really is one of these. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** Why `file` can't be uploaded, or null if it looks fine. Size is capped by the platform, not here. */
export function imageFileError(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Choose an image to upload.";
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG, WebP or AVIF image.";
  }
  return null;
}

/** The words around an image. Alt text describes it for people who can't see it. */
export const mediaDetailsSchema = z.object({
  alt: optionalText(200),
  caption: optionalText(300),
});

export function mediaDetailsFormValues(formData: FormData) {
  return {
    alt: formData.get("alt") ?? "",
    caption: formData.get("caption") ?? "",
  };
}
