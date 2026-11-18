import { describe, expect, it } from "vitest";
import { imageFileError, mediaDetailsSchema } from "./media.schema";

describe("imageFileError", () => {
  it("accepts the supported image types", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
      expect(imageFileError(new File(["x"], "a", { type }))).toBeNull();
    }
  });

  it("rejects a missing or empty file", () => {
    expect(imageFileError(null)).toMatch(/Choose/);
    expect(imageFileError("photo.jpg")).toMatch(/Choose/);
    expect(imageFileError(new File([], "a.jpg", { type: "image/jpeg" }))).toMatch(/Choose/);
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", ""])("rejects type %j", (type) => {
    expect(imageFileError(new File(["x"], "a", { type }))).toMatch(/JPEG, PNG/);
  });
});

describe("mediaDetailsSchema", () => {
  it("trims and turns blanks into null", () => {
    expect(mediaDetailsSchema.parse({ alt: "  Sunrise over Sardinia Bay ", caption: "" })).toEqual({
      alt: "Sunrise over Sardinia Bay",
      caption: null,
    });
  });

  it("caps alt text length", () => {
    expect(mediaDetailsSchema.safeParse({ alt: "a".repeat(201), caption: null }).success).toBe(
      false,
    );
  });

  it("refuses unknown fields", () => {
    expect(mediaDetailsSchema.safeParse({ alt: "a", caption: null, key: "x" }).success).toBe(false);
  });
});
