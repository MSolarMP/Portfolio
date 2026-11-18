import { describe, expect, it } from "vitest";
import { imageFileError, mediaDetailsFormValues, mediaDetailsSchema } from "./media";

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
    const fd = new FormData();
    fd.append("alt", "  Sunrise over Sardinia Bay ");
    fd.append("caption", "");
    fd.append("region", "Eastern Cape");
    expect(mediaDetailsSchema.parse(mediaDetailsFormValues(fd))).toEqual({
      alt: "Sunrise over Sardinia Bay",
      caption: null,
      region: "Eastern Cape",
    });
  });

  it("caps alt text length", () => {
    const fd = new FormData();
    fd.append("alt", "a".repeat(201));
    expect(mediaDetailsSchema.safeParse(mediaDetailsFormValues(fd)).success).toBe(false);
  });
});
