"use client";

import { FormField, fieldClass } from "@/components/admin/form-field";
import { createdState, useEditorForm } from "@/components/admin/use-editor-form";
import { SaveBar } from "@/components/admin/save-bar";
import { VisibilityFields } from "@/components/admin/visibility-fields";
import type { Status } from "@/generated/prisma/enums";
import { QUOTE_MAX } from "@/modules/commendations/commendations.schema";
import {
  createCommendationAction,
  updateCommendationAction,
} from "@/modules/commendations/commendations.actions";

export type Values = {
  quote: string;
  name: string;
  headline: string;
  relationship: string;
  /** "2026-11-18", or "" if unknown. */
  givenOn: string;
  profileUrl: string;
  status: Status;
  featured: boolean;
};

export const blankValues: Values = {
  quote: "",
  name: "",
  headline: "",
  relationship: "",
  givenOn: "",
  profileUrl: "",
  status: "DRAFT",
  featured: false,
};

function normalise(v: Values): Values {
  return {
    ...v,
    quote: v.quote.trim(),
    name: v.name.trim(),
    headline: v.headline.trim(),
    relationship: v.relationship.trim(),
    profileUrl: v.profileUrl.trim(),
  };
}

const card = "bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5";

// Today in the Keeper's time zone, as the date picker's upper limit.
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date());

/** Create (no `id`) or edit (with `id`) a commendation. */
export function CommendationForm({
  id,
  initial,
  justCreated = false,
}: {
  id?: string;
  initial: Values;
  justCreated?: boolean;
}) {
  const { values, set, dirty, state, formAction, pending, errors, revert } = useEditorForm<Values>({
    initial,
    normalise: normalise,
    submit: (v) => (id ? updateCommendationAction(id, v) : createCommendationAction(v)),
    initialState: justCreated ? createdState() : undefined,
  });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className={card}>
        <h2 className="label-caps">The recommendation</h2>
        <FormField
          label="Quote"
          error={errors.quote}
          hint={`Paste it exactly as it appears on LinkedIn. ${values.quote.length}/${QUOTE_MAX}`}
        >
          {(field) => (
            <textarea
              {...field}
              name="quote"
              required
              maxLength={QUOTE_MAX}
              value={values.quote}
              onChange={(e) => set("quote", e.target.value)}
              className={`${fieldClass} field-sizing-content min-h-40 font-serif text-base`}
            />
          )}
        </FormField>
      </section>

      <section className={card}>
        <h2 className="label-caps">Who wrote it</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" error={errors.name}>
            {(field) => (
              <input
                {...field}
                name="name"
                required
                maxLength={80}
                autoComplete="off"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField
            label="Their role"
            error={errors.headline}
            hint="At the time, e.g. CTO at FantasyGo."
          >
            {(field) => (
              <input
                {...field}
                name="headline"
                maxLength={120}
                value={values.headline}
                onChange={(e) => set("headline", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField
            label="Relationship"
            error={errors.relationship}
            hint="As LinkedIn shows it, e.g. Managed Matthew directly."
          >
            {(field) => (
              <input
                {...field}
                name="relationship"
                maxLength={120}
                value={values.relationship}
                onChange={(e) => set("relationship", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Date given" error={errors.givenOn}>
            {(field) => (
              <input
                {...field}
                name="givenOn"
                type="date"
                max={today()}
                value={values.givenOn}
                onChange={(e) => set("givenOn", e.target.value)}
                className={`${fieldClass} min-h-11`}
              />
            )}
          </FormField>
        </div>
        <FormField
          label="LinkedIn profile"
          error={errors.profileUrl}
          hint="Shown as “Read on LinkedIn”, so visitors can check it's real."
        >
          {(field) => (
            <input
              {...field}
              name="profileUrl"
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/…"
              value={values.profileUrl}
              onChange={(e) => set("profileUrl", e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
      </section>

      <VisibilityFields
        status={values.status}
        featured={values.featured}
        featuredLabel="Featured: shown on the home page"
        onStatus={(s) => set("status", s)}
        onFeatured={(f) => set("featured", f)}
      />

      <SaveBar
        isNew={!id}
        createLabel="Create commendation"
        cancelHref="/admin/commendations"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={revert}
      />
    </form>
  );
}
