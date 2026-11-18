import type { Metadata } from "next";
import { blankValues, CommendationForm } from "../commendation-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New commendation" };

export default function NewCommendation() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: "/admin/commendations", label: "Commendations" }}
        title="New commendation"
        description="It starts as a draft, so nothing goes live until you publish."
      />
      <CommendationForm initial={blankValues} />
    </div>
  );
}
