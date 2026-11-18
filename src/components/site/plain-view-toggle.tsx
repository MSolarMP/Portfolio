"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { PLAIN_VIEW_KEY } from "@/lib/plain-view";

const html = () => document.documentElement;
const isPlain = () => html().dataset.view === "plain";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(html(), { attributes: true, attributeFilter: ["data-view"] });
  return () => observer.disconnect();
}

/** Toggles `<html data-view="plain">`. The inline script in the root layout applies it before paint. */
export function PlainViewToggle() {
  // Server snapshot is "decorated"; the client value takes over right after hydration.
  const plain = useSyncExternalStore(subscribe, isPlain, () => false);

  // React's dev-only remount resets <html> attributes; put the choice back. No-op in production.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(PLAIN_VIEW_KEY) === "plain") html().dataset.view = "plain";
    } catch {}
  }, []);

  function toggle() {
    const next = !plain;
    if (next) html().dataset.view = "plain";
    else delete html().dataset.view;
    try {
      if (next) localStorage.setItem(PLAIN_VIEW_KEY, "plain");
      else localStorage.removeItem(PLAIN_VIEW_KEY);
    } catch {}
  }

  return (
    <button
      type="button"
      aria-pressed={plain}
      onClick={toggle}
      className="border-gold-thread/50 text-on-leather-muted hover:border-gold-thread hover:text-on-leather aria-pressed:border-gold-thread aria-pressed:bg-gold-thread aria-pressed:text-leather inline-flex min-h-11 items-center border px-3.5 font-sans text-sm"
    >
      Plain view
    </button>
  );
}
