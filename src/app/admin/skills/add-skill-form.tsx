"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/admin/button";
import { FormField, fieldClass } from "@/components/admin/form-field";
import { idle } from "@/lib/action-state";
import { SKILL_CATEGORIES, type SkillCategory } from "@/modules/skills/skills.schema";
import { createSkillAction } from "@/modules/skills/skills.actions";

/** Quick add: after each add the name clears and keeps focus, so you can type the next one. */
export function AddSkillForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("frontend");
  const [headline, setHeadline] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(async () => {
    const result = await createSkillAction({ name, category, headline });
    if (result.status === "success") {
      setName("");
      setHeadline(false);
      nameInput.current?.focus();
    }
    return result;
  }, idle);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      action={formAction}
      className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-4 sm:px-5"
    >
      <h2 className="label-caps">Add a skill</h2>
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_12rem_auto_auto]">
        <FormField label="Name" error={errors.name}>
          {(field) => (
            <input
              {...field}
              ref={nameInput}
              name="name"
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          )}
        </FormField>
        <FormField label="Category" error={errors.category}>
          {(field) => (
            <select
              {...field}
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
              className={`${fieldClass} min-h-11`}
            >
              {SKILL_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <label className="flex min-h-11 items-center gap-2 sm:mt-7">
          <input
            type="checkbox"
            name="headline"
            checked={headline}
            onChange={(e) => setHeadline(e.target.checked)}
            className="accent-oxblood h-5 w-5"
          />
          Headline
        </label>
        <Button type="submit" disabled={pending || !name.trim()} className="sm:mt-6">
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.status === "error" && !state.fieldErrors ? (
          <span className="text-oxblood font-bold">{state.message}</span>
        ) : state.status === "success" ? (
          <span className="text-moss-text font-bold">{state.message}</span>
        ) : null}
      </p>
    </form>
  );
}
