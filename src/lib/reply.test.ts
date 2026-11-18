import { describe, expect, it } from "vitest";
import { excerpt } from "./format";
import { replyHref } from "./reply";

describe("replyHref", () => {
  it("builds an encoded mailto with a Re: subject and a greeting", () => {
    const href = replyHref({
      email: "jane@example.com",
      purpose: "Job opportunity",
      name: "Jane Doe",
    });
    expect(href).toBe(
      "mailto:jane%40example.com?subject=Re%3A%20Job%20opportunity&body=Hi%20Jane%2C%0A%0A",
    );
  });

  it("can't be used to add headers", () => {
    const href = replyHref({
      email: "x@example.com?bcc=evil@example.com",
      purpose: "Hi\r\nBcc: evil@example.com",
      name: "X",
    });
    const url = new URL(href);
    expect([...url.searchParams.keys()]).toEqual(["subject", "body"]);
    expect(url.searchParams.get("subject")).toBe("Re: Hi Bcc: evil@example.com");
    expect(decodeURIComponent(url.pathname)).toBe("x@example.com?bcc=evil@example.com");
  });
});

describe("excerpt", () => {
  it("flattens whitespace and cuts with an ellipsis", () => {
    expect(excerpt("Hello\n\n  there", 50)).toBe("Hello there");
    expect(excerpt("a".repeat(20), 10)).toBe(`${"a".repeat(10)}…`);
  });
});
