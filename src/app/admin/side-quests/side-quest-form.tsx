"use client";

import { useState } from "react";
import { Button } from "@/components/admin/button";
import { createdState, useEditorForm } from "@/components/admin/use-editor-form";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveBar } from "@/components/admin/save-bar";
import { MediaPicker } from "@/components/admin/media-picker";
import { VisibilityFields } from "@/components/admin/visibility-fields";
import type { Status } from "@/generated/prisma/enums";
import { type RichDoc, richTextKey } from "@/lib/rich-text";
import { slugify } from "@/lib/validation/fields";
import {
  createSideQuestAction,
  updateSideQuestAction,
} from "@/modules/side-quests/side-quests.actions";
import { type Stat, STATS_MAX, TAGLINE_MAX } from "@/modules/side-quests/side-quests.schema";
import type { MediaOption } from "@/modules/media";

export type Values = {
  title: string;
  slug: string;
  tagline: string;
  attribute: string;
  /** Tiptap JSON as a string, "" when empty. */
  body: string;
  /** Media id of the cover, "" for none. */
  coverId: string;
  stats: Stat[];
  status: Status;
  featured: boolean;
};

export const blankValues: Values = {
  title: "",
  slug: "",
  tagline: "",
  attribute: "",
  body: "",
  coverId: "",
  stats: [],
  status: "DRAFT",
  featured: false,
};

/** Trim like the server does, so "saved" and "dirty" compare what's actually stored. */
function normalise(v: Values): Values {
  return {
    ...v,
    title: v.title.trim(),
    slug: v.slug.trim(),
    tagline: v.tagline.trim(),
    attribute: v.attribute.trim(),
    body: richTextKey(v.body),
    stats: v.stats
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label || s.value),
  };
}

/** The form's values in the shape the side-quest schema expects. */
function toBody(v: Values) {
  return {
    title: v.title,
    slug: v.slug,
    tagline: v.tagline,
    attribute: v.attribute,
    body: v.body ? (JSON.parse(v.body) as RichDoc) : null,
    coverId: v.coverId || null,
    stats: normalise(v).stats,
    status: v.status,
    featured: v.featured,
  };
}

/**
 * Create (no `id`) or edit (with `id`) a side quest. Fields are controlled so a
 * failed save keeps what you typed, and so the slug can follow the title until you edit it.
 */
export function SideQuestForm({
  id,
  initial,
  media,
  justCreated = false,
}: {
  id?: string;
  initial: Values;
  /** Vault images to pick the cover from. */
  media: MediaOption[];
  justCreated?: boolean;
}) {
  const {
    values,
    saved,
    setValues,
    set,
    dirty,
    state,
    formAction,
    pending,
    errors,
    revert,
    revision,
  } = useEditorForm<Values>({
    initial,
    normalise: normalise,
    submit: (v) => (id ? updateSideQuestAction(id, toBody(v)) : createSideQuestAction(toBody(v))),
    initialState: justCreated ? createdState() : undefined,
  });
  // New side quests: the slug tracks the title until the Keeper types in the slug box.
  const [slugTouched, setSlugTouched] = useState(Boolean(id));

  function setStat(index: number, patch: Partial<Stat>) {
    set(
      "stats",
      values.stats.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5">
        <h2 className="label-caps">Basics</h2>

        <FormField label="Title" error={errors.title}>
          {(field) => (
            <input
              {...field}
              name="title"
              required
              maxLength={80}
              value={values.title}
              onChange={(e) => {
                const title = e.target.value;
                setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
              }}
              className={`${fieldClass} font-display text-lg`}
            />
          )}
        </FormField>

        <FormField
          label="Slug"
          error={errors.slug}
          hint={
            <>
              Used in links: <code className="font-mono">{values.slug || "…"}</code>. Lowercase
              letters, numbers and hyphens.
            </>
          }
        >
          {(field) => (
            <input
              {...field}
              name="slug"
              required
              maxLength={60}
              autoCapitalize="none"
              spellCheck={false}
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className={`${fieldClass} font-mono text-sm`}
            />
          )}
        </FormField>

        <FormField
          label="Tagline"
          error={errors.tagline}
          hint={`One line under the title. ${values.tagline.length}/${TAGLINE_MAX}`}
        >
          {(field) => (
            <input
              {...field}
              name="tagline"
              maxLength={TAGLINE_MAX}
              value={values.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className={`${fieldClass} font-serif text-base`}
            />
          )}
        </FormField>

        <FormField
          label="Attribute"
          error={errors.attribute}
          hint="The RPG stat this hobby trains, e.g. Perception or Endurance."
        >
          {(field) => (
            <input
              {...field}
              name="attribute"
              maxLength={40}
              value={values.attribute}
              onChange={(e) => set("attribute", e.target.value)}
              className={`${fieldClass} sm:max-w-xs`}
            />
          )}
        </FormField>
      </section>

      <fieldset
        aria-describedby="stats-hint"
        className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-5 sm:px-5"
      >
        <legend className="label-caps float-left mb-1 w-full">Stats</legend>
        <p id="stats-hint" className="text-ink-faded text-sm">
          Small label + value pairs shown on the card, e.g. “Races finished · 14”. Up to {STATS_MAX}
          .
        </p>
        {errors.stats && <p className="text-oxblood text-sm font-bold">{errors.stats}</p>}

        {values.stats.map((stat, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm font-bold">
              Label {i + 1}
              <input
                name="statLabel"
                maxLength={40}
                value={stat.label}
                onChange={(e) => setStat(i, { label: e.target.value })}
                className={`${fieldClass} font-normal`}
              />
            </label>
            <label className="flex w-32 flex-col gap-1.5 text-sm font-bold">
              Value {i + 1}
              <input
                name="statValue"
                maxLength={40}
                value={stat.value}
                onChange={(e) => setStat(i, { value: e.target.value })}
                className={`${fieldClass} font-normal`}
              />
            </label>
            <Button
              variant="ghost"
              aria-label={`Remove stat ${i + 1}`}
              onClick={() =>
                set(
                  "stats",
                  values.stats.filter((_, j) => j !== i),
                )
              }
            >
              Remove
            </Button>
          </div>
        ))}

        <div>
          <Button
            variant="secondary"
            disabled={values.stats.length >= STATS_MAX}
            onClick={() => set("stats", [...values.stats, { label: "", value: "" }])}
          >
            Add stat
          </Button>
        </div>
      </fieldset>

      <section className="bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5">
        <h2 className="label-caps">Story</h2>
        <MediaPicker
          name="coverId"
          label="Cover image"
          hint="Shown on the side quest's card and at the top of its story."
          error={errors.coverId}
          options={media}
          value={values.coverId}
          onChange={(coverId) => set("coverId", coverId)}
        />
        <RichTextEditor
          key={revision}
          name="body"
          label="The story"
          hint="Shown when a visitor opens this side quest."
          error={errors.body}
          initial={parseDoc(saved.body)}
          onChange={(body) => set("body", body)}
        />
      </section>

      <VisibilityFields
        status={values.status}
        featured={values.featured}
        featuredLabel="Featured: shown large at the top of the list"
        onStatus={(s) => set("status", s)}
        onFeatured={(f) => set("featured", f)}
      />

      <SaveBar
        isNew={!id}
        createLabel="Create side quest"
        cancelHref="/admin/side-quests"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={revert}
      />
    </form>
  );
}

function parseDoc(json: string): RichDoc | null {
  return json ? (JSON.parse(json) as RichDoc) : null;
}
