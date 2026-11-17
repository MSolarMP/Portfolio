import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { enabledProviders } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="leather flex min-h-95 flex-[1_1_520px] flex-col justify-between gap-8 p-8 sm:p-12">
        <Link
          href="/"
          className="font-display text-gold-thread hover:text-gold-light inline-flex min-h-11 items-center self-start font-bold"
        >
          ← Return to the ledger
        </Link>
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="wax-seal h-32 w-32 text-4xl sm:h-36 sm:w-36" aria-hidden="true">
            MP
          </span>
          <h1 className="font-display text-on-leather text-4xl font-bold text-balance sm:text-5xl">
            The Gate
          </h1>
          <p className="text-gold-thread max-w-md text-xl text-pretty italic">
            The Archive is kept by one Keeper. Everything else in the ledger is open to all — no
            account needed.
          </p>
        </div>
        <p className="text-on-leather-faint text-center font-sans text-sm">
          Secure HTTP-only sessions · owner-only access · no passwords stored
        </p>
      </section>

      <main className="flex flex-[1_1_480px] items-center justify-center px-4 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-5">
          <span className="label-caps">Speak your name, traveller</span>
          <h2 className="font-display text-3xl font-bold">Sign in</h2>
          <Suspense fallback={<div className="h-72" aria-busy="true" />}>
            <SignInForm providers={enabledProviders} />
          </Suspense>
          <p className="text-ink-faded text-base">
            Only the site&apos;s owner can sign in. Visitors don&apos;t need an account.
          </p>
        </div>
      </main>
    </div>
  );
}
