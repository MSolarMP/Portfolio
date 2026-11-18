"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, fromServiceError, invalid, success } from "@/lib/action-state";
import { allow, limits, retryMessage } from "@/lib/ratelimit";
import { requireAdmin } from "@/modules/auth";
import { imageFileError, mediaDetailsSchema } from "./media.schema";
import * as service from "./media.service";

/** Controllers for the Media vault forms. Rules and storage live in the service. */

const VAULT = "/admin/media";

/** Upload form (FormData, because it carries the file). On success, opens the new image. */
export async function uploadMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
  const details = mediaDetailsSchema.safeParse({
    alt: formData.get("alt") ?? "",
    caption: formData.get("caption") ?? "",
  });
  if (!details.success) return invalid(details.error);

  let id: string;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    ({ id } = await service.uploadImage({ name: file.name, size: file.size, bytes }, details.data));
  } catch (err) {
    return fromServiceError(err);
  }
  redirect(`${VAULT}/${id}?created=1`);
}

export async function updateMediaAction(id: string, input: unknown): Promise<ActionState> {
  await requireAdmin(`${VAULT}/${id}`);
  const parsed = mediaDetailsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await service.updateMediaDetails(id, parsed.data);
    refresh();
    return success("Saved.");
  } catch (err) {
    return fromServiceError(err);
  }
}

export async function deleteMediaAction(id: string): Promise<ActionState> {
  await requireAdmin(`${VAULT}/${id}`);
  try {
    await service.deleteMedia(id);
  } catch (err) {
    return fromServiceError(err);
  }
  redirect(VAULT);
}
