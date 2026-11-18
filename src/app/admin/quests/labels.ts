import type { QuestKind, Rarity } from "@/generated/prisma/enums";

export const RARITY_LABELS: Record<Rarity, string> = {
  LEGENDARY: "Legendary",
  EPIC: "Epic",
  RARE: "Rare",
};

export const KIND_LABELS: Record<QuestKind, string> = {
  CLIENT: "Client work (guild contract)",
  PERSONAL: "Personal project (personal forge)",
};
