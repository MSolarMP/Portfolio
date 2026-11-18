import type { Status } from "@/generated/prisma/enums";

/** Draft/Published radios + the Featured checkbox, posted as `status` and `featured`. */
export function VisibilityFields({
  status,
  featured,
  featuredLabel,
  onStatus,
  onFeatured,
}: {
  status: Status;
  featured: boolean;
  featuredLabel: string;
  onStatus: (status: Status) => void;
  onFeatured: (featured: boolean) => void;
}) {
  return (
    <fieldset className="bg-vellum border-rule flex flex-col gap-3 rounded border px-4 py-5 sm:px-5">
      <legend className="label-caps float-left mb-1 w-full">Visibility</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {(["DRAFT", "PUBLISHED"] as const).map((s) => (
          <label key={s} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="status"
              value={s}
              checked={status === s}
              onChange={() => onStatus(s)}
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
          checked={featured}
          onChange={(e) => onFeatured(e.target.checked)}
          className="accent-oxblood h-5 w-5"
        />
        {featuredLabel}
      </label>
    </fieldset>
  );
}
