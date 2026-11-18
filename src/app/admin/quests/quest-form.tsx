"use client";

import { useActionState, useState } from "react";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveBar } from "@/components/admin/save-bar";
import { MediaPicker } from "@/components/admin/media-picker";
import { VisibilityFields } from "@/components/admin/visibility-fields";
import type { QuestKind, Rarity, Status } from "@/generated/prisma/enums";
import { type ActionState, idle } from "@/lib/action-state";
import { type RichDoc, richTextKey } from "@/lib/rich-text";
import { parseStack, slugify, STACK_MAX } from "@/lib/schemas/fields";
import { QUEST_SECTIONS, type QuestSection, SUMMARY_MAX } from "@/lib/schemas/quest";
import type { MediaOption } from "@/server/content/media";
import { createQuest, updateQuest } from "./actions";
import { KIND_LABELS, RARITY_LABELS } from "./labels";

export type Values = {
  title: string;
  slug: string;
  kind: QuestKind;
  rarity: Rarity;
  client: string;
  role: string;
  summary: string;
  /** Comma-separated, as typed. */
  stack: string;
  repoUrl: string;
  liveUrl: string;
  chapterId: string;
  /** Media id of the architecture diagram, "" for none. */
  diagramId: string;
  /** Each section's Tiptap JSON as a string, "" when empty. */
  sections: Record<QuestSection, string>;
  status: Status;
  featured: boolean;
};

export type ChapterOption = { id: string; numeral: string; role: string; company: string };

export const blankValues: Values = {
  title: "",
  slug: "",
  kind: "CLIENT",
  rarity: "EPIC",
  client: "",
  role: "",
  summary: "",
  stack: "",
  repoUrl: "",
  liveUrl: "",
  chapterId: "",
  diagramId: "",
  sections: Object.fromEntries(QUEST_SECTIONS.map((s) => [s.key, ""])) as Values["sections"],
  status: "DRAFT",
  featured: false,
};

/** Reduce to what the server would store, so "unsaved changes" ignores whitespace etc. */
function normalise(v: Values): Values {
  return {
    ...v,
    title: v.title.trim(),
    slug: v.slug.trim(),
    client: v.client.trim(),
    role: v.role.trim(),
    summary: v.summary.trim(),
    stack: parseStack(v.stack).join(", "),
    repoUrl: v.repoUrl.trim(),
    liveUrl: v.liveUrl.trim(),
    sections: Object.fromEntries(
      QUEST_SECTIONS.map((s) => [s.key, richTextKey(v.sections[s.key])]),
    ) as Values["sections"],
  };
}

const same = (a: Values, b: Values) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

const created: ActionState = { status: "success", message: "Created.", at: 0 };

const card = "bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5";

/** Create (no `id`) or edit (with `id`) a quest. Same pattern as the side quest form. */
export function QuestForm({
  id,
  initial,
  chapters,
  media,
  justCreated = false,
}: {
  id?: string;
  initial: Values;
  chapters: ChapterOption[];
  /** Vault images to pick the diagram from. */
  media: MediaOption[];
  justCreated?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  // Bumped on Revert to remount the rich-text editors with the saved content.
  const [revision, setRevision] = useState(0);
  const dirty = !same(values, saved);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = id ? await updateQuest(id, prev, formData) : await createQuest(prev, formData);
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

  const stackCount = parseStack(values.stack).length;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className={card}>
        <h2 className="label-caps">Basics</h2>

        <FormField
          label="Title"
          error={errors.title}
          hint="The themed name, e.g. The Great Migration."
        >
          {(field) => (
            <input
              {...field}
              name="title"
              required
              maxLength={100}
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
              The page address: <code className="font-mono">/quests/{values.slug || "…"}</code>.
              Changing it breaks old links.
            </>
          }
        >
          {(field) => (
            <input
              {...field}
              name="slug"
              required
              maxLength={80}
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

        <fieldset className="flex flex-col gap-1">
          <legend className="font-sans text-sm font-bold">Kind</legend>
          <div className="flex flex-wrap gap-x-6">
            {(["CLIENT", "PERSONAL"] as const).map((k) => (
              <label key={k} className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={values.kind === k}
                  onChange={() => set("kind", k)}
                  className="accent-oxblood h-5 w-5"
                />
                {KIND_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Client"
            error={errors.client}
            hint={values.kind === "PERSONAL" ? "Optional for personal projects." : undefined}
          >
            {(field) => (
              <input
                {...field}
                name="client"
                maxLength={80}
                value={values.client}
                onChange={(e) => set("client", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Your role" error={errors.role}>
            {(field) => (
              <input
                {...field}
                name="role"
                maxLength={80}
                value={values.role}
                onChange={(e) => set("role", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Rarity" error={errors.rarity} hint="How big a deal it was.">
            {(field) => (
              <select
                {...field}
                name="rarity"
                value={values.rarity}
                onChange={(e) => set("rarity", e.target.value as Rarity)}
                className={`${fieldClass} min-h-11`}
              >
                {(["LEGENDARY", "EPIC", "RARE"] as const).map((r) => (
                  <option key={r} value={r}>
                    {RARITY_LABELS[r]}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField
            label="Chronicle chapter"
            error={errors.chapterId}
            hint="The job this quest belongs to."
          >
            {(field) => (
              <select
                {...field}
                name="chapterId"
                value={values.chapterId}
                onChange={(e) => set("chapterId", e.target.value)}
                className={`${fieldClass} min-h-11`}
              >
                <option value="">None</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numeral}. {c.role}, {c.company}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>
      </section>

      <section className={card}>
        <h2 className="label-caps">Card</h2>
        <FormField
          label="Summary"
          error={errors.summary}
          hint={`One or two sentences for the quest card. ${values.summary.length}/${SUMMARY_MAX}`}
        >
          {(field) => (
            <textarea
              {...field}
              name="summary"
              required
              maxLength={SUMMARY_MAX}
              value={values.summary}
              onChange={(e) => set("summary", e.target.value)}
              className={`${fieldClass} field-sizing-content min-h-20 font-serif text-base`}
            />
          )}
        </FormField>
        <FormField
          label="Stack"
          error={errors.stack}
          hint={`Separate with commas, e.g. Next.js, Prisma, PostgreSQL. ${stackCount}/${STACK_MAX}`}
        >
          {(field) => (
            <input
              {...field}
              name="stack"
              value={values.stack}
              onChange={(e) => set("stack", e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Code link" error={errors.repoUrl} hint="Public repo, if any.">
            {(field) => (
              <input
                {...field}
                name="repoUrl"
                type="url"
                inputMode="url"
                placeholder="https://github.com/…"
                value={values.repoUrl}
                onChange={(e) => set("repoUrl", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Live link" error={errors.liveUrl} hint="The product, if it's public.">
            {(field) => (
              <input
                {...field}
                name="liveUrl"
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={values.liveUrl}
                onChange={(e) => set("liveUrl", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="label-caps">Case study</h2>
          <p className="text-ink-faded text-sm">Leave a section empty to hide it.</p>
        </div>
        <MediaPicker
          name="diagramId"
          label="Architecture diagram"
          hint="An image of how the system fits together. Make it in any tool, export a PNG, upload it to the vault."
          error={errors.diagramId}
          options={media}
          value={values.diagramId}
          onChange={(diagramId) => set("diagramId", diagramId)}
        />
        {QUEST_SECTIONS.map((s) => (
          <RichTextEditor
            key={`${s.key}-${revision}`}
            name={s.key}
            label={s.label}
            hint={s.hint}
            error={errors[s.key]}
            initial={parseDoc(saved.sections[s.key])}
            onChange={(json) =>
              setValues((v) => ({ ...v, sections: { ...v.sections, [s.key]: json } }))
            }
          />
        ))}
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
        createLabel="Create quest"
        cancelHref="/admin/quests"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={() => {
          setValues(saved);
          setRevision((r) => r + 1);
        }}
      />
    </form>
  );
}

function parseDoc(json: string): RichDoc | null {
  return json ? (JSON.parse(json) as RichDoc) : null;
}
