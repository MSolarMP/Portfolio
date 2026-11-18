"use client";

import { useActionState, useId, useRef, useState } from "react";
import { Button } from "@/components/admin/button";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { SaveBar } from "@/components/admin/save-bar";
import { type ActionState, idle } from "@/lib/action-state";
import { BULLETS_MAX, CHAPTER_SUMMARY_MAX } from "@/lib/schemas/chapter";
import { parseStack, STACK_MAX } from "@/lib/schemas/fields";
import { createChapter, updateChapter } from "./actions";

export type Values = {
  numeral: string;
  role: string;
  company: string;
  location: string;
  /** "2026-08"; endMonth "" = present. */
  startMonth: string;
  endMonth: string;
  summary: string;
  bullets: string[];
  stack: string;
};

export const blankValues: Values = {
  numeral: "",
  role: "",
  company: "",
  location: "",
  startMonth: "",
  endMonth: "",
  summary: "",
  bullets: [],
  stack: "",
};

/** Reduce to what the server would store, so "unsaved changes" ignores whitespace etc. */
function normalise(v: Values): Values {
  return {
    ...v,
    numeral: v.numeral.trim().toUpperCase(),
    role: v.role.trim(),
    company: v.company.trim(),
    location: v.location.trim(),
    summary: v.summary.trim(),
    bullets: v.bullets.map((b) => b.trim()).filter(Boolean),
    stack: parseStack(v.stack).join(", "),
  };
}

const same = (a: Values, b: Values) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

const created: ActionState = { status: "success", message: "Created.", at: 0 };

const card = "bg-vellum border-rule flex flex-col gap-4 rounded border px-4 py-5 sm:px-5";

/** Create (no `id`) or edit (with `id`) a Chronicle chapter. */
export function ChapterForm({
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
  const dirty = !same(values, saved);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = id
        ? await updateChapter(id, prev, formData)
        : await createChapter(prev, formData);
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className={card}>
        <h2 className="label-caps">The job</h2>

        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <FormField label="Numeral" error={errors.numeral} hint="e.g. IV">
            {(field) => (
              <input
                {...field}
                name="numeral"
                required
                maxLength={8}
                autoCapitalize="characters"
                spellCheck={false}
                value={values.numeral}
                onChange={(e) => set("numeral", e.target.value)}
                className={`${fieldClass} font-display text-lg`}
              />
            )}
          </FormField>
          <FormField label="Role" error={errors.role}>
            {(field) => (
              <input
                {...field}
                name="role"
                required
                maxLength={80}
                value={values.role}
                onChange={(e) => set("role", e.target.value)}
                className={`${fieldClass} font-display text-lg`}
              />
            )}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company" error={errors.company}>
            {(field) => (
              <input
                {...field}
                name="company"
                required
                maxLength={80}
                value={values.company}
                onChange={(e) => set("company", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Location" error={errors.location} hint="e.g. Remote, Gqeberha">
            {(field) => (
              <input
                {...field}
                name="location"
                maxLength={80}
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                className={fieldClass}
              />
            )}
          </FormField>
          <FormField label="Started" error={errors.startMonth}>
            {(field) => (
              <input
                {...field}
                name="startMonth"
                type="month"
                required
                value={values.startMonth}
                onChange={(e) => set("startMonth", e.target.value)}
                className={`${fieldClass} min-h-11`}
              />
            )}
          </FormField>
          <FormField
            label="Finished"
            error={errors.endMonth}
            hint="Leave empty if you still work here."
          >
            {(field) => (
              <input
                {...field}
                name="endMonth"
                type="month"
                min={values.startMonth || undefined}
                value={values.endMonth}
                onChange={(e) => set("endMonth", e.target.value)}
                className={`${fieldClass} min-h-11`}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={card}>
        <h2 className="label-caps">What you did</h2>
        <FormField
          label="Summary"
          error={errors.summary}
          hint={`One line under the job title. ${values.summary.length}/${CHAPTER_SUMMARY_MAX}`}
        >
          {(field) => (
            <textarea
              {...field}
              name="summary"
              required
              maxLength={CHAPTER_SUMMARY_MAX}
              value={values.summary}
              onChange={(e) => set("summary", e.target.value)}
              className={`${fieldClass} field-sizing-content min-h-20 font-serif text-base`}
            />
          )}
        </FormField>

        <Bullets
          bullets={values.bullets}
          error={errors.bullets}
          onChange={(bullets) => set("bullets", bullets)}
        />

        <FormField
          label="Stack"
          error={errors.stack}
          hint={`Separate with commas. ${parseStack(values.stack).length}/${STACK_MAX}`}
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
      </section>

      <SaveBar
        isNew={!id}
        createLabel="Create chapter"
        cancelHref="/admin/chronicle"
        dirty={dirty}
        pending={pending}
        state={state}
        onRevert={() => setValues(saved)}
      />
    </form>
  );
}

/** The bullet-point list: add, remove and move. Posted as repeated `bullet` fields, in order. */
function Bullets({
  bullets,
  error,
  onChange,
}: {
  bullets: string[];
  error?: string;
  onChange: (bullets: string[]) => void;
}) {
  const hintId = useId();
  const list = useRef<HTMLOListElement>(null);

  // Moves an item and keeps focus on the moved row's matching button (or its text box).
  function move(from: number, to: number, focus: "up" | "down") {
    const next = [...bullets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    requestAnimationFrame(() => {
      const row = list.current?.children[to];
      const button = row?.querySelector<HTMLButtonElement>(`[data-move="${focus}"]:not(:disabled)`);
      (button ?? row?.querySelector("textarea"))?.focus();
    });
  }

  return (
    <fieldset aria-describedby={hintId} className="flex flex-col gap-2">
      <legend className="font-sans text-sm font-bold">Highlights</legend>
      <p id={hintId} className="text-ink-faded text-sm">
        Short bullet points, most important first. Up to {BULLETS_MAX}.
      </p>
      {error && <p className="text-oxblood text-sm font-bold">{error}</p>}

      <ol ref={list} className="flex flex-col gap-2">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-1">
            <span aria-hidden="true" className="text-ink-faded w-5 pt-2.5 text-right text-sm">
              {i + 1}.
            </span>
            <textarea
              name="bullet"
              aria-label={`Highlight ${i + 1}`}
              maxLength={300}
              value={bullet}
              onChange={(e) => onChange(bullets.map((b, j) => (j === i ? e.target.value : b)))}
              className={`${fieldClass} field-sizing-content min-h-11 flex-1`}
            />
            <button
              type="button"
              data-move="up"
              aria-label={`Move highlight ${i + 1} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1, "up")}
              className="hover:bg-aged inline-flex h-11 w-11 shrink-0 items-center justify-center rounded disabled:opacity-30"
            >
              <span aria-hidden="true">↑</span>
            </button>
            <button
              type="button"
              data-move="down"
              aria-label={`Move highlight ${i + 1} down`}
              disabled={i === bullets.length - 1}
              onClick={() => move(i, i + 1, "down")}
              className="hover:bg-aged inline-flex h-11 w-11 shrink-0 items-center justify-center rounded disabled:opacity-30"
            >
              <span aria-hidden="true">↓</span>
            </button>
            <button
              type="button"
              aria-label={`Remove highlight ${i + 1}`}
              onClick={() => onChange(bullets.filter((_, j) => j !== i))}
              className="hover:bg-aged text-oxblood inline-flex h-11 w-11 shrink-0 items-center justify-center rounded"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </li>
        ))}
      </ol>

      <div>
        <Button
          variant="secondary"
          disabled={bullets.length >= BULLETS_MAX}
          onClick={() => {
            onChange([...bullets, ""]);
            requestAnimationFrame(() =>
              list.current?.lastElementChild?.querySelector("textarea")?.focus(),
            );
          }}
        >
          Add highlight
        </Button>
      </div>
    </fieldset>
  );
}
