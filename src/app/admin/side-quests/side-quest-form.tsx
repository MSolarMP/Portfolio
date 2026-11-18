"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { FormField, fieldClass } from "@/components/admin/form-field";
import type { Status } from "@/generated/prisma/enums";
import { type ActionState, idle } from "@/lib/action-state";
import { slugify, type Stat, STATS_MAX, TAGLINE_MAX } from "@/lib/schemas/interest";
import { createInterest, updateInterest } from "./actions";

export type Values = {
  title: string;
  slug: string;
  tagline: string;
  attribute: string;
  stats: Stat[];
  status: Status;
  featured: boolean;
};

export const blankValues: Values = {
  title: "",
  slug: "",
  tagline: "",
  attribute: "",
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
    stats: v.stats
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label || s.value),
  };
}

const created: ActionState = { status: "success", message: "Created.", at: 0 };

const same = (a: Values, b: Values) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

/**
 * Create (no `id`) or edit (with `id`) a side quest. Fields are controlled so a
 * failed save keeps what you typed, and so the slug can follow the title until you edit it.
 */
export function SideQuestForm({
  id,
  initial,
  justCreated = false,
}: {
  id?: string;
  initial: Values;
  justCreated?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  // New side quests: the slug tracks the title until the Keeper types in the slug box.
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const dirty = !same(values, saved);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      // Create redirects to the edit page on success, so only edits come back with "success".
      const result = id
        ? await updateInterest(id, prev, formData)
        : await createInterest(prev, formData);
      if (result.status === "success") {
        const stored = normalise(values);
        setSaved(stored);
        setValues(stored);
      }
      return result;
    },
    justCreated ? created : idle,
  );

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

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

      <fieldset className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-5 sm:px-5">
        <legend className="label-caps float-left mb-1 w-full">Visibility</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {(["DRAFT", "PUBLISHED"] as const).map((s) => (
            <label key={s} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="status"
                value={s}
                checked={values.status === s}
                onChange={() => set("status", s)}
                className="accent-oxblood h-5 w-5"
              />
              {s === "DRAFT" ? "Draft (hidden)" : "Published (on the site)"}
            </label>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            checked={values.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="accent-oxblood h-5 w-5"
          />
          Featured: shown large at the top of the list
        </label>
      </fieldset>

      <section className="border-rule text-ink-faded rounded border border-dashed px-4 py-4 text-sm sm:px-5">
        <b className="text-ink">Story and cover image</b> come later: the story with the rich-text
        editor (Quests), the cover with the Media vault.
      </section>

      <div className="bg-parchment/95 border-rule sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t px-1 py-3">
        <Button type="submit" disabled={pending || (Boolean(id) && !dirty)}>
          {pending ? "Saving…" : id ? "Save" : "Create side quest"}
        </Button>
        {id ? (
          dirty &&
          !pending && (
            <Button variant="ghost" onClick={() => setValues(saved)}>
              Revert
            </Button>
          )
        ) : (
          <Link href="/admin/side-quests" className="inline-flex min-h-11 items-center px-2">
            Cancel
          </Link>
        )}
        <p aria-live="polite" className="text-sm">
          {state.status === "error" ? (
            <span className="text-oxblood font-bold">{state.message}</span>
          ) : id && dirty ? (
            <span className="text-ink-faded">Unsaved changes</span>
          ) : state.status === "success" ? (
            <span className="text-moss-text font-bold">{state.message}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
