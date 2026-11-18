import { z } from "zod";

/**
 * Rich text is stored as Tiptap JSON. Nothing from the browser is trusted:
 * `cleanRichDoc` rebuilds the document keeping only the node types, marks and
 * attributes below, so the public renderer only ever sees a known, safe shape.
 * The editor (`components/admin/rich-text-editor.tsx`) is configured to match.
 */

export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
};
export type RichDoc = { type: "doc"; content: RichNode[] };

/** Rough cap on stored size, so one field can't grow without bound. */
export const RICH_TEXT_MAX_BYTES = 100_000;

const BLOCKS = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
]);
const INLINE = new Set(["text", "hardBreak"]);
const MARKS = new Set(["bold", "italic", "strike", "code", "link"]);

/** http(s), mailto, same-site paths and in-page anchors. Never `javascript:` or `data:`. */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string" || href.length > 2000) return false;
  const h = href.trim();
  if (h.startsWith("#")) return true;
  if (h.startsWith("/")) return !h.startsWith("//") && !h.startsWith("/\\");
  return /^(https?:\/\/|mailto:)/i.test(h);
}

class RichTextError extends Error {}

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: RichMark[] = [];
  for (const m of marks) {
    if (!m || typeof m !== "object" || !MARKS.has(m.type)) continue;
    if (m.type === "link") {
      if (!isSafeHref(m.attrs?.href))
        throw new RichTextError("Links must start with https://, mailto: or /.");
      out.push({ type: "link", attrs: { href: m.attrs.href.trim() } });
    } else {
      out.push({ type: m.type });
    }
  }
  return out.length ? out : undefined;
}

function cleanNode(node: unknown, depth: number): RichNode | null {
  if (depth > 20) throw new RichTextError("The text is nested too deeply.");
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown> & { type?: unknown };
  const type = typeof n.type === "string" ? n.type : "";

  if (type === "text") {
    if (typeof n.text !== "string" || n.text === "") return null;
    const marks = cleanMarks(n.marks);
    return marks ? { type, text: n.text, marks } : { type, text: n.text };
  }
  if (type === "hardBreak" || type === "horizontalRule") return { type };
  // Unknown blocks are dropped rather than rejected, e.g. something pasted from another app.
  if (!BLOCKS.has(type)) return null;

  const content = Array.isArray(n.content)
    ? n.content.flatMap((c) => cleanNode(c, depth + 1) ?? [])
    : [];
  const attrs = n.attrs as Record<string, unknown> | undefined;
  const out: RichNode = { type };

  if (type === "heading") out.attrs = { level: attrs?.level === 3 ? 3 : 2 };
  if (type === "orderedList") {
    const start = Number(attrs?.start);
    out.attrs = { start: Number.isInteger(start) && start > 0 && start < 10_000 ? start : 1 };
  }
  if (type === "codeBlock") {
    const lang = attrs?.language;
    out.attrs = {
      language: typeof lang === "string" && /^[a-z0-9+#-]{1,20}$/i.test(lang) ? lang : null,
    };
    // Code blocks hold plain text only.
    const text = content.map((c) => c.text ?? "").join("");
    return text ? { ...out, content: [{ type: "text", text }] } : out;
  }
  if (content.length) out.content = content;
  return out;
}

/** True when there's no visible text (e.g. one empty paragraph). */
function isEmpty(nodes: RichNode[]): boolean {
  return nodes.every(
    (n) =>
      n.type !== "horizontalRule" &&
      (n.type === "text" ? !n.text?.trim() : isEmpty(n.content ?? [])),
  );
}

/**
 * Rebuilds a Tiptap document from the allow-list. Returns null for an empty document.
 * Throws RichTextError for things we refuse outright (unsafe links, oversized input).
 */
export function cleanRichDoc(input: unknown): RichDoc | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input !== "object" || (input as { type?: unknown }).type !== "doc") {
    throw new RichTextError("That text couldn't be read.");
  }
  const raw = (input as { content?: unknown }).content;
  const content = Array.isArray(raw)
    ? raw.flatMap((c) => {
        const node = cleanNode(c, 0);
        // Only blocks may sit at the top level.
        return node && !INLINE.has(node.type) ? [node] : [];
      })
    : [];
  return isEmpty(content) ? null : { type: "doc", content };
}

/**
 * Zod field for a rich-text form value: the editor posts its JSON as a string.
 * Parses, cleans and size-checks it; an empty document becomes null.
 */
export const richTextField = z.string().transform((raw, ctx) => {
  if (raw.length > RICH_TEXT_MAX_BYTES) {
    ctx.addIssue({ code: "custom", message: "This section is too long." });
    return z.NEVER;
  }
  try {
    return cleanRichDoc(raw ? JSON.parse(raw) : null);
  } catch (err) {
    ctx.addIssue({
      code: "custom",
      message: err instanceof RichTextError ? err.message : "That text couldn't be read.",
    });
    return z.NEVER;
  }
});

/**
 * The editor's JSON string reduced to what the server would store, so two values
 * can be compared for "unsaved changes". Unreadable input compares as itself.
 */
export function richTextKey(json: string): string {
  try {
    const doc = cleanRichDoc(json ? JSON.parse(json) : null);
    return doc ? JSON.stringify(doc) : "";
  } catch {
    return json;
  }
}

/** Reads a stored JSON column back as a RichDoc (cleaned again, in case it was edited by hand). */
export function readRichDoc(json: unknown): RichDoc | null {
  try {
    return cleanRichDoc(json);
  } catch {
    return null;
  }
}
