// Equipment icon word-matching and vector drawing helpers (Design.md section 3.4).

import type { IconKey } from "@/types/quotation";

const ICON_MATCH_RULES: ReadonlyArray<{
  key: Exclude<IconKey, "generic">;
  words: ReadonlyArray<string>;
}> = [
  { key: "net", words: ["net"] },
  {
    key: "ball",
    words: [
      "ball",
      "volley",
      "football",
      "cosco",
      "nivia",
      "basketball",
      "throwball",
      "handball",
    ],
  },
  { key: "dice", words: ["ludo", "snake", "dice"] },
  { key: "carrom", words: ["carrom", "carram", "strox"] },
  { key: "chess", words: ["chess"] },
];

/**
 * Picks the matching icon key for an item name, ignoring capital letters.
 * Unknown items always get "generic" and never fail.
 */
export function matchIconKey(itemName: string): IconKey {
  const lower = itemName.toLowerCase();

  // If "net" appears in the name (for example "Volleyball Net"), prefer the net icon
  for (const rule of ICON_MATCH_RULES) {
    for (const word of rule.words) {
      if (lower.includes(word)) {
        return rule.key;
      }
    }
  }

  return "generic";
}
