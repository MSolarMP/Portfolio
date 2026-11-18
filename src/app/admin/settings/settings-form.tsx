"use client";

import { FormField, fieldClass } from "@/components/admin/form-field";
import { useEditorForm } from "@/components/admin/use-editor-form";
import { SaveBar } from "@/components/admin/save-bar";
import { saveSettings } from "./actions";

type Values = { openToWork: boolean; roleType: string; githubUrl: string; linkedinUrl: string };

const trim = (v: Values): Values => ({
  ...v,
  roleType: v.roleType.trim(),
  githubUrl: v.githubUrl.trim(),
  linkedinUrl: v.linkedinUrl.trim(),
});

const card = "bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5";

export function SettingsForm({ initial }: { initial: Values }) {
  const { values, set, dirty, state, formAction, pending, errors, revert } = useEditorForm<Values>({
    initial,
    normalise: trim,
    submit: saveSettings,
  });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className={card}>
        <h2 className="label-caps">Availability</h2>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="openToWork"
            checked={values.openToWork}
            onChange={(e) => set("openToWork", e.target.checked)}
            className="accent-oxblood h-5 w-5"
          />
          Open to work: show the availability banner on the site
        </label>
        <FormField
          label="What you're looking for"
          error={errors.roleType}
          hint="Shown in the banner, e.g. Full-time · remote or Gqeberha. Leave empty to hide."
        >
          {(field) => (
            <input
              {...field}
              name="roleType"
              maxLength={80}
              value={values.roleType}
              onChange={(e) => set("roleType", e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
      </section>

      <section className={card}>
        <h2 className="label-caps">Social links</h2>
        <p className="text-ink-faded -mt-2 text-sm">Shown in the site header and footer.</p>
        <FormField label="GitHub" error={errors.githubUrl}>
          {(field) => (
            <input
              {...field}
              name="githubUrl"
              type="url"
              inputMode="url"
              placeholder="https://github.com/…"
              value={values.githubUrl}
              onChange={(e) => set("githubUrl", e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
        <FormField label="LinkedIn" error={errors.linkedinUrl}>
          {(field) => (
            <input
              {...field}
              name="linkedinUrl"
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/…"
              value={values.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
      </section>

      <SaveBar
        isNew={false}
        createLabel=""
        cancelHref="/admin"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={revert}
      />
    </form>
  );
}
