/** Parsea @menciones y #hashtags en texto de gambas */
const MENTION_RE = /(^|[\s(])@([a-z0-9_]{3,20})/gi;
const HASHTAG_RE = /(^|[\s(])#([a-z0-9_\u00C0-\u024F]{2,40})/gi;

export function extractMentions(content: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, "gi");
  while ((m = re.exec(content)) !== null) {
    found.add(m[2].toLowerCase());
  }
  return [...found];
}

export function extractHashtags(content: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(HASHTAG_RE.source, "gi");
  while ((m = re.exec(content)) !== null) {
    found.add(m[2].toLowerCase());
  }
  return [...found];
}

export type ContentPart =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; username: string }
  | { type: "hashtag"; value: string; tag: string };

export function parseContentParts(text: string): ContentPart[] {
  const combined =
    /(@[a-z0-9_]{3,20}|#[a-z0-9_\u00C0-\u024F]{2,40})/gi;
  const parts: ContentPart[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("@")) {
      parts.push({
        type: "mention",
        value: token,
        username: token.slice(1).toLowerCase(),
      });
    } else {
      parts.push({
        type: "hashtag",
        value: token,
        tag: token.slice(1).toLowerCase(),
      });
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
}
