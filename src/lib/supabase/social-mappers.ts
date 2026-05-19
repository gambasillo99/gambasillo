import type {
  Poll,
  PollOption,
  ProfileLink,
  ReactionCounts,
  ReactionEmoji,
} from "@/types";
import { EMPTY_REACTIONS } from "@/types";
import type { Json } from "./types";

export function parseLinks(value: Json | null | undefined): ProfileLink[] {
  if (!value || !Array.isArray(value)) return [];
  return value
    .filter(
      (l): l is { label: string; url: string } =>
        typeof l === "object" &&
        l !== null &&
        "url" in l &&
        typeof (l as { url: unknown }).url === "string"
    )
    .map((l) => ({
      label: String((l as { label?: string }).label ?? l.url),
      url: (l as { url: string }).url,
    }));
}

export function serializeLinks(links: ProfileLink[]): Json {
  return JSON.parse(JSON.stringify(links)) as Json;
}

export function parsePoll(
  value: Json | null | undefined,
  voteCounts: Record<string, number> = {}
): Poll | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as { options?: { id: string; text: string }[] };
  if (!raw.options?.length) return null;
  return {
    options: raw.options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: voteCounts[o.id] ?? 0,
    })),
  };
}

export function buildPollForInsert(options: string[]): Json {
  return {
    options: options
      .filter((t) => t.trim())
      .slice(0, 4)
      .map((text, i) => ({
        id: `opt-${i + 1}`,
        text: text.trim(),
      })),
  } as Json;
}

export function sumReactions(rows: { emoji: string }[]): ReactionCounts {
  const counts = { ...EMPTY_REACTIONS };
  for (const r of rows) {
    const key = r.emoji as ReactionEmoji;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}
