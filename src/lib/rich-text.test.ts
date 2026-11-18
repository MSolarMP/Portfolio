import { describe, expect, it } from "vitest";
import { cleanRichDoc, isSafeHref, RICH_TEXT_MAX_BYTES, richTextField } from "./rich-text";

const p = (...content: object[]) => ({ type: "paragraph", content });
const text = (t: string, marks?: object[]) => ({ type: "text", text: t, ...(marks && { marks }) });
const doc = (...content: object[]) => ({ type: "doc", content });

describe("isSafeHref", () => {
  it.each(["https://example.com", "http://x.io/a?b=1", "mailto:hi@x.io", "/quests/a", "#top"])(
    "allows %s",
    (href) => expect(isSafeHref(href)).toBe(true),
  );
  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html,x",
    "//evil.com",
    "/\\evil.com",
    "ftp://x",
  ])("rejects %s", (href) => expect(isSafeHref(href)).toBe(false));
});

describe("cleanRichDoc", () => {
  it("keeps allowed nodes and marks", () => {
    const input = doc(
      { type: "heading", attrs: { level: 2 }, content: [text("Problem")] },
      p(text("Bold", [{ type: "bold" }]), { type: "hardBreak" }, text("plain")),
      { type: "bulletList", content: [{ type: "listItem", content: [p(text("one"))] }] },
    );
    expect(cleanRichDoc(input)).toEqual(input);
  });

  it("drops unknown nodes, marks and attributes", () => {
    const input = doc(
      { type: "iframe", attrs: { src: "https://evil" } },
      p(
        text("hi", [
          { type: "bold", attrs: { onclick: "x" } },
          { type: "textStyle", attrs: { color: "red" } },
        ]),
      ),
      { type: "heading", attrs: { level: 1, id: "x" }, content: [text("H")] },
    );
    expect(cleanRichDoc(input)).toEqual(
      doc(p(text("hi", [{ type: "bold" }])), {
        type: "heading",
        attrs: { level: 2 },
        content: [text("H")],
      }),
    );
  });

  it("keeps only href on links and refuses unsafe ones", () => {
    const link = (href: string) =>
      doc(p(text("x", [{ type: "link", attrs: { href, target: "_blank", class: "c" } }])));
    expect(cleanRichDoc(link("https://github.com"))).toEqual(
      doc(p(text("x", [{ type: "link", attrs: { href: "https://github.com" } }]))),
    );
    expect(() => cleanRichDoc(link("javascript:alert(1)"))).toThrow(/Links must/);
  });

  it("returns null for empty documents", () => {
    expect(cleanRichDoc(null)).toBeNull();
    expect(cleanRichDoc(doc({ type: "paragraph" }))).toBeNull();
    expect(cleanRichDoc(doc(p(text("   "))))).toBeNull();
  });

  it("rejects things that aren't a document", () => {
    expect(() => cleanRichDoc({ type: "paragraph" })).toThrow();
    expect(() => cleanRichDoc("<p>hi</p>")).toThrow();
  });

  it("flattens code blocks to plain text and checks the language", () => {
    const input = doc({
      type: "codeBlock",
      attrs: { language: 'ts"><script>' },
      content: [text("const a = 1;", [{ type: "bold" }])],
    });
    expect(cleanRichDoc(input)).toEqual(
      doc({ type: "codeBlock", attrs: { language: null }, content: [text("const a = 1;")] }),
    );
  });
});

describe("richTextField", () => {
  it("parses the editor's JSON string", () => {
    const value = JSON.stringify(doc(p(text("hi"))));
    expect(richTextField.parse(value)).toEqual(doc(p(text("hi"))));
    expect(richTextField.parse("")).toBeNull();
  });

  it("reports bad JSON and oversized input as field errors", () => {
    expect(richTextField.safeParse("{not json").success).toBe(false);
    expect(richTextField.safeParse("x".repeat(RICH_TEXT_MAX_BYTES + 1)).success).toBe(false);
  });
});
