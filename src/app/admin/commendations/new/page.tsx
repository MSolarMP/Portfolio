import type { Metadata } from "next";
import Link from "next/link";
import { blankValues, CommendationForm } from "../commendation-form";

export const metadata: Metadata = { title: "New commendation" };

export default function NewCommendation() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/admin/commendations" className="text-sm">
          ← Commendations
        </Link>
        <h1 className="font-display text-3xl font-bold">New commendation</h1>
        <p className="text-ink-faded">
          It starts as a draft, so nothing goes live until you publish.
        </p>
      </div>
      <CommendationForm initial={blankValues} />
    </div>
  );
}
