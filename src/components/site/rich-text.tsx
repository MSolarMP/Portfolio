import { Fragment, type ReactNode } from "react";
import { isSafeHref, type RichDoc, type RichNode } from "@/lib/rich-text";

/**
 * Renders stored Tiptap JSON as React elements. Only the allow-listed nodes and marks
 * from `src/lib/rich-text.ts` produce output; anything else renders nothing. No HTML
 * strings are ever injected. Read docs with `readRichDoc()` first so they're cleaned.
 *
 * `headingOffset` shifts heading levels down, e.g. 1 turns the editor's H2 into an H3
 * when the text sits under a card's own H2.
 */
export function RichText({
  doc,
  headingOffset = 0,
  className = "",
}: {
  doc: RichDoc | null;
  headingOffset?: number;
  className?: string;
}) {
  if (!doc) return null;
  return <div className={`rich-text ${className}`}>{renderNodes(doc.content, headingOffset)}</div>;
}

function renderNodes(nodes: RichNode[] | undefined, offset: number): ReactNode[] {
  return (nodes ?? []).map((node, i) => renderNode(node, i, offset));
}

function renderNode(node: RichNode, key: number, offset: number): ReactNode {
  const children = () => renderNodes(node.content, offset);
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children()}</p>;
    case "heading": {
      const level = Math.min(6, (node.attrs?.level === 3 ? 3 : 2) + offset);
      const H = `h${level}` as "h2" | "h3" | "h4" | "h5" | "h6";
      return <H key={key}>{children()}</H>;
    }
    case "bulletList":
      return <ul key={key}>{children()}</ul>;
    case "orderedList": {
      const start = Number(node.attrs?.start) || 1;
      return (
        <ol key={key} start={start === 1 ? undefined : start}>
          {children()}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{children()}</li>;
    case "blockquote":
      return <blockquote key={key}>{children()}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{node.content?.map((c) => c.text ?? "").join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "text":
      return renderText(node, key);
    default:
      return null;
  }
}

function renderText(node: RichNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "code") out = <code>{out}</code>;
    else if (mark.type === "link" && isSafeHref(mark.attrs?.href)) {
      out = <a href={mark.attrs.href}>{out}</a>;
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}
