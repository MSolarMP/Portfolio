"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { type ActionState, idle } from "@/lib/action-state";
import { formatBytes } from "@/lib/format";
import { IMAGE_TYPES } from "@/lib/schemas/media";
import { uploadMedia } from "./actions";

/** Pick an image (+ optional alt text) and upload. On success the action opens the new image. */
export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(uploadMedia, idle);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      action={formAction}
      className="bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5"
    >
      <h2 className="label-caps">Upload an image</h2>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <FormField
          label="Image"
          error={errors.file}
          hint={
            file
              ? `${file.name} · ${formatBytes(file.size)}`
              : "JPEG, PNG, WebP or AVIF. Location data is removed from the public copies."
          }
        >
          {(field) => (
            <input
              {...field}
              type="file"
              name="file"
              required
              accept={IMAGE_TYPES.join(",")}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${fieldClass} file:bg-aged file:text-ink file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5 file:font-bold`}
            />
          )}
        </FormField>
        <FormField
          label="Alt text"
          error={errors.alt}
          hint="Describe it for people who can't see it. You can add it later."
        >
          {(field) => <input {...field} name="alt" maxLength={200} className={fieldClass} />}
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !file}>
          {pending ? "Uploading and resizing…" : "Upload"}
        </Button>
        <p aria-live="polite" className="text-sm">
          {pending ? (
            <span className="text-ink-faded">This takes a few seconds for large photos.</span>
          ) : state.status === "error" && !state.fieldErrors ? (
            <span className="text-oxblood font-bold">{state.message}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
