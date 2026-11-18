"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, invalid, success } from "@/lib/action-state";
import { tags } from "@/lib/cache-tags";
import { imageFileError, mediaDetailsFormValues, mediaDetailsSchema } from "@/lib/schemas/media";
import { requireAdmin } from "@/server/authz";
import type { VariantMap } from "@/server/content/media";
import { db } from "@/server/db";
import { processImage, type ProcessedImage } from "@/server/media/process";
import { buckets, putObject, removeObjects } from "@/server/media/storage";
import { allow, limits, retryMessage } from "@/server/ratelimit";

const VAULT = "/admin/media";

const EXT: Record<ProcessedImage["format"], string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

/** Covers and diagrams show images, so media changes refresh those pages too. */
function refresh() {
  updateTag(tags.media);
  updateTag(tags.interests);
  updateTag(tags.quests);
}

/**
 * Upload → check → resize with sharp → store the original privately and the
 * resized, metadata-free copies publicly → save the Media row.
 * If any storage write fails, whatever was written is removed again.
 */
export async function uploadMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin(VAULT);

  const limit = await allow(limits.upload, user.id);
  if (!limit.ok) {
    return {
      status: "error",
      message: `That's a lot of uploads in one hour. ${retryMessage(limit.retryAfterSeconds)}`,
    };
  }

  const file = formData.get("file");
  const fileError = imageFileError(file);
  if (fileError || !(file instanceof File)) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { file: fileError ?? "" },
    };
  }
  const details = mediaDetailsSchema.safeParse(mediaDetailsFormValues(formData));
  if (!details.success) return invalid(details.error);

  const original = Buffer.from(await file.arrayBuffer());
  let image: ProcessedImage;
  try {
    image = await processImage(original);
  } catch {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { file: "That file couldn't be read as a JPEG, PNG, WebP or AVIF image." },
    };
  }

  const id = randomUUID();
  const key = `${id}/original.${EXT[image.format]}`;
  const variants: VariantMap = {};
  const publicPaths: string[] = [];
  for (const v of image.variants) {
    const path = `${id}/${v.width}.${v.format}`;
    (variants[v.format] ??= {})[v.width] = path;
    publicPaths.push(path);
  }

  try {
    await Promise.all([
      putObject(buckets.originals, key, original, `image/${image.format}`),
      ...image.variants.map((v) =>
        putObject(buckets.public, `${id}/${v.width}.${v.format}`, v.data, `image/${v.format}`),
      ),
    ]);
  } catch (err) {
    console.error("Media upload failed", err);
    await Promise.allSettled([
      removeObjects(buckets.originals, [key]),
      removeObjects(buckets.public, publicPaths),
    ]);
    return { status: "error", message: "The image couldn't be stored. Try again in a moment." };
  }

  await db.media.create({
    data: {
      id,
      kind: "IMAGE",
      state: "READY",
      key,
      filename: file.name.slice(0, 200) || `image.${EXT[image.format]}`,
      mimeType: `image/${image.format}`,
      bytes: file.size,
      width: image.width,
      height: image.height,
      blurData: image.blurData,
      variants,
      ...details.data,
    },
  });

  refresh();
  redirect(`${VAULT}/${id}?created=1`);
}

export async function updateMedia(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(`${VAULT}/${id}`);

  const parsed = mediaDetailsSchema.safeParse(mediaDetailsFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  const { count } = await db.media.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return { status: "error", message: "This image no longer exists." };

  refresh();
  return success("Saved.");
}

/** Removes the files from both buckets, then the row. Covers and diagrams using it are cleared by the FK. */
export async function deleteMedia(id: string): Promise<ActionState> {
  await requireAdmin(`${VAULT}/${id}`);

  const row = await db.media.findUnique({ where: { id }, select: { key: true, variants: true } });
  if (row) {
    const variants = (row.variants ?? {}) as VariantMap;
    const publicPaths = Object.values(variants).flatMap((byWidth) => Object.values(byWidth ?? {}));
    try {
      await Promise.all([
        removeObjects(buckets.originals, [row.key]),
        removeObjects(buckets.public, publicPaths),
      ]);
    } catch (err) {
      console.error("Media delete failed", err);
      return { status: "error", message: "The files couldn't be deleted. Try again in a moment." };
    }
    await db.media.deleteMany({ where: { id } });
    refresh();
  }
  redirect(VAULT);
}
