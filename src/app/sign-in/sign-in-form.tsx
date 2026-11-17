"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useState, useTransition, ViewTransition, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";

type Providers = { github: boolean; magicLink: boolean };
type Failure = { source: "magic" | "social"; message: string };

export function SignInForm({ providers }: { providers: Providers }) {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  // Better Auth sends refused or failed GitHub sign-ins back here with ?error=…
  const [failure, setFailure] = useState<Failure | null>(() =>
    params.get("error")
      ? {
          source: "social",
          message: "That account can't enter the Archive. Only the Keeper may sign in.",
        }
      : null,
  );
  const [isPending, startPending] = useTransition();

  function social(provider: "github") {
    setFailure(null);
    startPending(async () => {
      const { error } = await authClient.signIn.social({ provider, callbackURL: next });
      if (error) {
        setFailure({
          source: "social",
          message: error.message ?? "That sign-in didn't go through. Try again, or use email.",
        });
      }
    });
  }

  function magic(e: FormEvent) {
    e.preventDefault();
    setFailure(null);
    startPending(async () => {
      const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
      if (error) {
        setFailure({
          source: "magic",
          message:
            error.message ?? "The letter couldn't be sent. Check the address and send again.",
        });
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

  const providerBtn =
    "flex min-h-13 w-full items-center justify-center gap-3 border border-bronze bg-vellum font-sans text-base font-bold text-ink transition-colors hover:bg-aged disabled:cursor-wait";
  const magicError = failure?.source === "magic" ? failure.message : null;

  return (
    <ViewTransition enter="auto" exit="auto">
      <div className="flex flex-col gap-4">
        {providers.github && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => social("github")}
            className={providerBtn}
          >
            <GitHubIcon /> Continue with GitHub
          </button>
        )}

        {failure?.source === "social" && (
          <p
            role="alert"
            className="text-oxblood border-oxblood/40 bg-oxblood-bg border px-3 py-2 font-sans"
          >
            {failure.message}
          </p>
        )}

        {providers.github && (
          <div className="font-display text-ink-faded flex items-center gap-3 text-xs tracking-[0.14em] uppercase">
            <span className="bg-bronze h-px flex-1" />
            or a magic letter
            <span className="bg-bronze h-px flex-1" />
          </div>
        )}

        <form onSubmit={magic} className="flex flex-col gap-4">
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
              aria-invalid={magicError ? true : undefined}
              aria-describedby={magicError ? "email-error" : undefined}
              className="border-bronze bg-vellum min-h-12 border px-3.5 font-sans text-base"
            />
            {magicError && (
              <p id="email-error" role="alert" className="text-oxblood font-sans text-sm">
                {magicError}
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
      </div>
    </ViewTransition>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
