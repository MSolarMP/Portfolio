import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processImage, variantWidths } from "./process";

/** A JPEG with camera EXIF and a GPS position, like a phone photo. */
function photo(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#7c2d25" } })
    .withExif({
      IFD0: { Make: "Fujifilm", Model: "X100V" },
      IFD2: {
        FNumber: "28/10",
        ExposureTime: "1/250",
        ISOSpeedRatings: "400",
        FocalLength: "23/1",
      },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "33/1 57/1 0/1",
        GPSLongitudeRef: "E",
        GPSLongitude: "25/1 36/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();
}

describe("variantWidths", () => {
  it("makes the standard widths below the image's own size, never enlarging", () => {
    expect(variantWidths(4000)).toEqual([640, 1280, 1920]);
    expect(variantWidths(1500)).toEqual([640, 1280, 1500]);
    expect(variantWidths(1280)).toEqual([640, 1280]);
    expect(variantWidths(400)).toEqual([400]);
  });
});

describe("processImage", () => {
  it("makes AVIF + WebP at each width with the right size, and a blur placeholder", async () => {
    const out = await processImage(await photo(1000, 600));
    expect(out).toMatchObject({ format: "jpeg", width: 1000, height: 600 });
    expect(out.blurData).toMatch(/^data:image\/webp;base64,/);
    expect(out.variants.map((v) => `${v.format}@${v.width}`).sort()).toEqual(
      ["avif@1000", "avif@640", "webp@1000", "webp@640"].sort(),
    );
    for (const v of out.variants) {
      const meta = await sharp(v.data).metadata();
      expect(meta.width).toBe(v.width);
      expect(meta.format).toBe(v.format === "avif" ? "heif" : "webp");
    }
  });

  it("strips every bit of metadata, including GPS, from the public copies", async () => {
    const input = await photo(700, 400);
    expect((await sharp(input).metadata()).exif).toBeDefined(); // the original carries EXIF + GPS

    const out = await processImage(input);
    for (const v of out.variants) {
      expect((await sharp(v.data).metadata()).exif).toBeUndefined();
    }
  });

  it("rejects files that aren't a supported image", async () => {
    await expect(processImage(Buffer.from("not an image"))).rejects.toThrow();
    const gif = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#000" } })
      .gif()
      .toBuffer();
    await expect(processImage(gif)).rejects.toThrow(/Unsupported/);
  });
});
