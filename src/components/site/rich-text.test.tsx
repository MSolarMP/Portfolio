import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RichDoc } from "@/lib/rich-text";
import { RichText } from "./rich-text";

const render = (doc: RichDoc | null, headingOffset = 0) =>
  renderToStaticMarkup(<RichText doc={doc} headingOffset={headingOffset} />);

describe("RichText", () => {
  it("renders nothing for an empty doc", () => {
    expect(render(null)).toBe("");
  });

  it("renders paragraphs, marks and safe links", () => {
    const html = render({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Bold", marks: [{ type: "bold" }] },
            { type: "text", text: " and " },
            { type: "text", text: "a link", marks: [{ type: "link", attrs: { href: "/quests" } }] },
          ],
        },
      ],
    });
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain('<a href="/quests">a link</a>');
  });

  it("escapes text instead of injecting HTML", () => {
    const html = render({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "<img src=x onerror=alert(1)>" }] },
      ],
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("drops unsafe links and unknown nodes even if they slipped into storage", () => {
    const html = render({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
        { type: "iframe", attrs: { src: "https://evil.example" } },
      ],
    });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("iframe");
    expect(html).toContain("click");
  });

  it("shifts heading levels by the offset", () => {
    const doc: RichDoc = {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hi" }] }],
    };
    expect(render(doc)).toContain("<h2>Hi</h2>");
    expect(render(doc, 1)).toContain("<h3>Hi</h3>");
  });
});
