"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useState, useTransition, ViewTransition, type FormEvent } from "react";
import { safeNext } from "@/lib/safe-next";

/**
 * POSTs to a Better Auth endpoint with a plain fetch, so the sign-in page ships no
 * auth library. Errors (including our 429 rate limit) come back as `{ message }`.
 */
async function authPost(path: string, body: object): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const json = await res.json().catch(() => null);
    return { ok: false, error: json?.message || undefined };
  } catch {
    return { ok: false, error: "You seem to be offline. Check your connection and try again." };
  }
}

export function SignInForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  // A link that's expired, already used, or not for the Keeper comes back here with ?error=…
  const [error, setError] = useState<string | null>(() =>
    params.get("error")
      ? "That link has expired or was already used. Send yourself a new one."
      : null,
  );
  const [isPending, startPending] = useTransition();

  function send(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startPending(async () => {
      const result = await authPost("/sign-in/magic-link", {
        email,
        callbackURL: next,
        errorCallbackURL: "/sign-in",
      });
      if (!result.ok) {
        setError(result.error ?? "The letter couldn't be sent. Check the address and send again.");
      } else {
        // Updates after an await need their own transition to animate.
        startTransition(() => setSent(true));
      }
    });
  }

  if (sent) {
    return (
      <ViewTransition enter="auto" exit="auto">
        <div className="ledger-card gem flex flex-col items-center gap-3 p-8 text-center">
          <span className="wax-seal h-16 w-16 text-lg" aria-hidden="true">
            MP
          </span>
          {/* Focus moves here so keyboard and screen-reader users land on the result. */}
          <h3
            ref={(el) => el?.focus()}
            tabIndex={-1}
            className="font-display text-2xl font-bold text-balance"
          >
            Check your inbox
          </h3>
          <p className="text-ink-faded">
            If <b className="text-ink break-all">{email}</b> belongs to the Keeper, a magic letter
            is on its way. The link works once and expires in 10 minutes.
          </p>
          <button
            type="button"
            onClick={() => startTransition(() => setSent(false))}
            className="font-display text-oxblood mt-2 min-h-11 font-bold hover:underline"
          >
            Use a different email
          </button>
        </div>
      </ViewTransition>
    );
  }

  return (
    <ViewTransition enter="auto" exit="auto">
      <form onSubmit={send} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-display text-sm font-bold tracking-wider">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "email-error" : undefined}
            className="border-bronze bg-vellum min-h-12 border px-3.5 font-sans text-base"
          />
          {error && (
            <p id="email-error" role="alert" className="text-oxblood font-sans text-sm">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-oxblood text-vellum font-display hover:bg-oxblood-dark border-oxblood-deep min-h-13 border font-bold tracking-widest shadow-[inset_0_0_0_3px_var(--color-oxblood),inset_0_0_0_4px_rgb(247_238_218/0.35)] disabled:cursor-wait"
        >
          {isPending ? "Sealing the letter…" : "Send the magic letter"}
        </button>
      </form>
    </ViewTransition>
  );
}
