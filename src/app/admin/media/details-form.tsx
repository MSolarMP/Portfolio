"use client";

import { FormField, fieldClass } from "@/components/admin/form-field";
import { createdState, useEditorForm } from "@/components/admin/use-editor-form";
import { SaveBar } from "@/components/admin/save-bar";
import { updateMedia } from "./actions";

type Values = { alt: string; caption: string };

const trim = (v: Values): Values => ({
  alt: v.alt.trim(),
  caption: v.caption.trim(),
});

/** Alt text and caption for one image. */
export function DetailsForm({
  id,
  initial,
  justCreated,
}: {
  id: string;
  initial: Values;
  justCreated: boolean;
}) {
  const { values, set, dirty, state, formAction, pending, errors, revert } = useEditorForm<Values>({
    initial,
    normalise: trim,
    submit: (prev, formData) => updateMedia(id, prev, formData),
    initialState: justCreated ? createdState("Uploaded.") : undefined,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5">
        <FormField
          label="Alt text"
          error={errors.alt}
          hint="What's in the picture, for screen readers and when it can't load. Leave empty only if it's purely decorative."
        >
          {(field) => (
            <textarea
              {...field}
              name="alt"
              maxLength={200}
              value={values.alt}
              onChange={(e) => set("alt", e.target.value)}
              className={`${fieldClass} field-sizing-content min-h-11`}
            />
          )}
        </FormField>
        <FormField label="Caption" error={errors.caption} hint="Shown under the image, if set.">
          {(field) => (
            <textarea
              {...field}
              name="caption"
              maxLength={300}
              value={values.caption}
              onChange={(e) => set("caption", e.target.value)}
              className={`${fieldClass} field-sizing-content min-h-11 font-serif`}
            />
          )}
        </FormField>
      </div>
      <SaveBar
        isNew={false}
        createLabel=""
        cancelHref="/admin/media"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={revert}
      />
    </form>
  );
}
