import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/admin/content-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { SKILL_CATEGORIES, type SkillCategory } from "@/modules/skills/skills.schema";
import { listSkills } from "@/modules/skills";
import { AddSkillForm } from "./add-skill-form";
import { type Row, SkillsTable } from "./skills-table";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsAdmin() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Skills (spells)"
        description="The skill tree, by category. Headline skills are shown larger. Drag to change the order within a category."
      />

      <AddSkillForm />

      <Suspense fallback={<ContentSkeleton label="Loading skills…" />}>
        <SkillGroups />
      </Suspense>
    </div>
  );
}

async function SkillGroups() {
  const skills = await listSkills();

  const byCategory = new Map<string, Row[]>();
  for (const s of skills) {
    byCategory.set(s.category, [
      ...(byCategory.get(s.category) ?? []),
      { ...s, category: s.category as SkillCategory },
    ]);
  }

  return SKILL_CATEGORIES.map(({ key, label }) => {
    const rows = byCategory.get(key) ?? [];
    return (
      <section key={key} aria-labelledby={`skills-${key}`} className="flex flex-col gap-2">
        <h2 id={`skills-${key}`} className="label-caps">
          {label} <span className="text-ink-faded">· {rows.length}</span>
        </h2>
        <SkillsTable
          // Remount when skills are added, removed or moved between categories.
          // Renames don't need it: each row keeps its own state.
          key={rows
            .map((r) => r.id)
            .sort()
            .join()}
          category={key}
          rows={rows}
        />
      </section>
    );
  });
}
