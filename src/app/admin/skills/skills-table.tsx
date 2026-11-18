"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/admin/button";
import { type Column, DataTable } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { fieldClass } from "@/components/admin/form-field";
import { type ActionState, idle } from "@/lib/action-state";
import { SKILL_CATEGORIES, type SkillCategory } from "@/lib/schemas/skill";
import { deleteSkill, reorderSkills, updateSkill } from "./actions";

export type Row = { id: string; name: string; category: SkillCategory; headline: boolean };

const columns: Column<Row>[] = [
  { key: "skill", header: "Skill", cell: (r) => <SkillRow skill={r} /> },
  {
    key: "delete",
    header: "",
    className: "w-0",
    cell: (r) => (
      <DeleteButton
        action={deleteSkill.bind(null, r.id)}
        ariaLabel={`Delete ${r.name}`}
        title={`Delete “${r.name}”?`}
        description="It disappears from the skill tree straight away."
        confirmLabel="Delete skill"
      />
    ),
  },
];

/** One category's skills, reorderable by drag or ↑ ↓. */
export function SkillsTable({ category, rows }: { category: SkillCategory; rows: Row[] }) {
  const label = SKILL_CATEGORIES.find((c) => c.key === category)?.label ?? category;
  return (
    <DataTable
      caption={`${label} skills`}
      rows={rows}
      columns={columns}
      getId={(r) => r.id}
      getLabel={(r) => r.name}
      onReorder={reorderSkills.bind(null, category)}
      empty={<span className="text-ink-faded">No {label.toLowerCase()} skills yet.</span>}
    />
  );
}

/** Inline editor for one skill: name, category and headline, with Save once something changes. */
function SkillRow({ skill }: { skill: Row }) {
  const [saved, setSaved] = useState(skill);
  const [value, setValue] = useState(skill);
  const dirty =
    value.name.trim() !== saved.name ||
    value.category !== saved.category ||
    value.headline !== saved.headline;

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateSkill(skill.id, prev, formData);
      if (result.status === "success") {
        const stored = { ...value, name: value.name.trim() };
        setSaved(stored);
        setValue(stored);
      }
      return result;
    },
    idle,
  );

  const error = state.status === "error" ? (state.fieldErrors?.name ?? state.message) : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          aria-label={`Name of ${saved.name}`}
          aria-invalid={error ? true : undefined}
          required
          maxLength={40}
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          className={`${fieldClass} min-w-40 flex-1 ${value.headline ? "font-bold" : ""}`}
        />
        <select
          name="category"
          aria-label={`Category of ${saved.name}`}
          value={value.category}
          onChange={(e) => setValue({ ...value, category: e.target.value as SkillCategory })}
          className={`${fieldClass} min-h-11 w-auto`}
        >
          {SKILL_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="headline"
            checked={value.headline}
            onChange={(e) => setValue({ ...value, headline: e.target.checked })}
            className="accent-oxblood h-5 w-5"
          />
          Headline
        </label>
        {dirty && (
          <>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            {!pending && (
              <Button variant="ghost" onClick={() => setValue(saved)}>
                Revert
              </Button>
            )}
          </>
        )}
      </div>
      <p aria-live="polite" className="text-sm">
        {error ? (
          <span className="text-oxblood font-bold">{error}</span>
        ) : !dirty && state.status === "success" ? (
          <span className="text-moss-text font-bold">Saved</span>
        ) : null}
      </p>
    </form>
  );
}
