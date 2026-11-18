import { useId, type ReactNode } from "react";

/** Classes for text inputs and textareas, so every field looks the same. */
export const fieldClass =
  "w-full rounded border border-rule bg-vellum-light px-3 py-2 font-sans text-ink placeholder:text-ink-faded aria-invalid:border-oxblood";

/** The attributes FormField hands to its control so label, hint and error are linked up. */
type ControlProps = {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

/**
 * Label + control + hint + error. The control is a function so you can see exactly
 * which attributes it gets:
 *
 *   <FormField label="Tagline" error={errors.tagline}>
 *     {(field) => <input {...field} name="tagline" className={fieldClass} />}
 *   </FormField>
 */
export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (field: ControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // Screen readers read these out after the label.
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-sm font-bold">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p id={hintId} className="text-ink-faded text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-oxblood text-sm font-bold">
          {error}
        </p>
      )}
    </div>
  );
}
