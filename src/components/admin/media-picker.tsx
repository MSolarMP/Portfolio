"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { MediaOption } from "@/modules/media";
import { Button } from "./button";

/**
 * Picks one image from the Media vault. Posts the chosen Media id in a hidden input
 * called `name` ("" for none). The choices open in a native <dialog> as a radio group,
 * so they work with the keyboard (arrow keys) and screen readers.
 */
export function MediaPicker({
  name,
  label,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  options: MediaOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  // What's highlighted inside the dialog, before pressing "Use this image".
  const [choice, setChoice] = useState(value);
  const current = options.find((o) => o.id === value);

  function open() {
    setChoice(value);
    dialog.current?.showModal();
  }

  return (
    <fieldset
      aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ")}
      className="flex flex-col gap-2"
    >
      <legend className="font-sans text-sm font-bold">{label}</legend>
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`bg-aged relative flex aspect-[4/3] w-48 items-center justify-center overflow-hidden rounded border ${
            error ? "border-oxblood" : "border-rule"
          }`}
        >
          {current?.thumbUrl ? (
            <Image
              src={current.thumbUrl}
              alt={current.alt ?? ""}
              fill
              sizes="192px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="text-ink-faded text-sm">{value ? "Image missing" : "No image"}</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          {current && <span className="max-w-60 truncate text-sm">{current.filename}</span>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={open}>
              {value ? "Change…" : "Choose…"}
            </Button>
            {value && (
              <Button variant="ghost" onClick={() => onChange("")}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {hint && (
        <p id={`${id}-hint`} className="text-ink-faded text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-oxblood text-sm font-bold">
          {error}
        </p>
      )}

      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        className="bg-vellum-light border-bronze text-ink backdrop:bg-ink/50 m-auto w-[min(56rem,calc(100%-2rem))] rounded border p-0"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="border-rule flex items-center justify-between gap-4 border-b px-5 py-3">
            <h2 id={`${id}-title`} className="font-display text-xl font-bold">
              {label}
            </h2>
            <Link href="/admin/media" target="_blank" className="text-sm">
              Upload in the Media vault ↗
            </Link>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            {options.length === 0 ? (
              <p className="text-ink-faded">
                The vault is empty. Upload an image in the Media vault, then reopen this.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-labelledby={`${id}-title`}
                className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
              >
                {options.map((o) => (
                  <label
                    key={o.id}
                    className={`bg-vellum focus-within:outline-oxblood flex cursor-pointer flex-col overflow-hidden rounded border-2 focus-within:outline-2 focus-within:outline-offset-2 ${
                      choice === o.id ? "border-oxblood" : "border-rule"
                    }`}
                  >
                    <input
                      type="radio"
                      // Grouped per picker; never submitted (the hidden input above is).
                      name={`${id}-choice`}
                      form="__none"
                      value={o.id}
                      checked={choice === o.id}
                      onChange={() => setChoice(o.id)}
                      className="sr-only"
                    />
                    <span className="bg-aged relative block aspect-[4/3]">
                      {o.thumbUrl && (
                        <Image
                          src={o.thumbUrl}
                          alt=""
                          fill
                          sizes="150px"
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="truncate px-2 py-1.5 text-sm">{o.alt || o.filename}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-rule flex justify-end gap-2 border-t px-5 py-3">
            <Button variant="ghost" onClick={() => dialog.current?.close()}>
              Cancel
            </Button>
            <Button
              disabled={!choice || choice === value}
              onClick={() => {
                onChange(choice);
                dialog.current?.close();
              }}
            >
              Use this image
            </Button>
          </div>
        </div>
      </dialog>
    </fieldset>
  );
}
