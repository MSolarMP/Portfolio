"use client";

import { useActionState, useState } from "react";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { SaveBar } from "@/components/admin/save-bar";
import { type ActionState, idle } from "@/lib/action-state";
import { updateMedia } from "./actions";

type Values = { alt: string; caption: string; region: string };

const trim = (v: Values): Values => ({
  alt: v.alt.trim(),
  caption: v.caption.trim(),
  region: v.region.trim(),
});

const created: ActionState = { status: "success", message: "Uploaded.", at: 0 };

/** Alt text, caption and coarse region for one image. */
export function DetailsForm({
  id,
  initial,
  justCreated,
}: {
  id: string;
  initial: Values;
  justCreated: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const dirty = JSON.stringify(trim(values)) !== JSON.stringify(trim(saved));

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateMedia(id, prev, formData);
      if (result.status === "success") {
        setSaved(trim(values));
        setValues(trim(values));
      }
      return result;
    },
    justCreated ? created : idle,
  );

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const set = (key: keyof Values, value: string) => setValues((v) => ({ ...v, [key]: value }));

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
        <FormField
          label="Region"
          error={errors.region}
          hint="Coarse only, e.g. Eastern Cape. Used on the map; never an exact place."
        >
          {(field) => (
            <input
              {...field}
              name="region"
              maxLength={60}
              value={values.region}
              onChange={(e) => set("region", e.target.value)}
              className={`${fieldClass} sm:max-w-xs`}
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
        onRevert={() => setValues(saved)}
      />
    </form>
  );
}
