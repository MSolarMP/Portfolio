import type { QuestKind, Rarity } from "@/generated/prisma/enums";

/** Wax-seal text and colour per rarity. Seals are decorative; `label` is what screen readers get. */
export const RARITY: Record<Rarity, { seal: string; label: string; className: string }> = {
  LEGENDARY: { seal: "LEG.", label: "Legendary", className: "" },
  EPIC: { seal: "EPIC", label: "Epic", className: "bg-leather!" },
  RARE: { seal: "RARE", label: "Rare", className: "bg-moss!" },
};

/** Themed names for the two kinds of quest (PROJECT_PLAN §2.4). */
export const QUEST_KIND: Record<QuestKind, string> = {
  CLIENT: "Guild contract",
  PERSONAL: "Personal forge",
};
