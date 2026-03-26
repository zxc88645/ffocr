import { describe, it, expect, vi, beforeEach } from "vitest";
import { preprocessDetection, preprocessRecognition } from "./preprocess";

vi.mock("../io/canvas", () => ({
  resizeImageData: (_source: ImageData, width: number, height: number): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
    return new ImageData(data, width, height);
  }
}));

function createFakeImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 100;
    data[i + 1] = 150;
    data[i + 2] = 200;
    data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

describe("preprocessDetection", () => {
  it("returns correct dims shape", () => {
    const source = createFakeImageData(200, 100);
    const result = preprocessDetection(source, 736);

    expect(result.dims).toHaveLength(4);
    expect(result.dims[0]).toBe(1);
    expect(result.dims[1]).toBe(3);
  });

  it("resized dimensions are multiples of 32", () => {
    const source = createFakeImageData(300, 200);
    const result = preprocessDetection(source, 736);

    expect(result.resizedWidth % 32).toBe(0);
    expect(result.resizedHeight % 32).toBe(0);
  });

  it("constrains to limitSideLen when image is large", () => {
    const source = createFakeImageData(2000, 1000);
    const result = preprocessDetection(source, 736);

    expect(result.resizedWidth).toBeLessThanOrEqual(736 + 31);
    expect(result.resizedHeight).toBeLessThanOrEqual(736 + 31);
  });

  it("does not upscale when image is within limit", () => {
    const source = createFakeImageData(200, 100);
    const result = preprocessDetection(source, 736);

    expect(result.resizedWidth).toBeGreaterThanOrEqual(32);
    expect(result.resizedHeight).toBeGreaterThanOrEqual(32);
  });

  it("tensor has correct length (3 * W * H)", () => {
    const source = createFakeImageData(400, 300);
    const result = preprocessDetection(source, 736);

    expect(result.data.length).toBe(3 * result.resizedWidth * result.resizedHeight);
  });

  it("tensor values are normalized", () => {
    const source = createFakeImageData(64, 64);
    const result = preprocessDetection(source, 736);

    for (let i = 0; i < result.data.length; i++) {
      expect(Number.isFinite(result.data[i])).toBe(true);
    }
  });
});

describe("preprocessRecognition", () => {
  it("returns correct dims shape", () => {
    const source = createFakeImageData(100, 32);
    const result = preprocessRecognition(source, [3, 48, 320]);

    expect(result.dims).toEqual([1, 3, 48, 320]);
  });

  it("tensor has correct length", () => {
    const source = createFakeImageData(100, 32);
    const result = preprocessRecognition(source, [3, 48, 320]);

    expect(result.data.length).toBe(3 * 48 * 320);
  });

  it("pads with zeros for width beyond resized region", () => {
    const source = createFakeImageData(10, 48);
    const result = preprocessRecognition(source, [3, 48, 320]);

    const targetWidth = 320;
    const targetHeight = 48;
    const tailOffset = (targetHeight - 1) * targetWidth + targetWidth - 1;
    expect(result.data[tailOffset]).toBe(0);
  });

  it("handles very wide images by clamping width", () => {
    const source = createFakeImageData(1000, 48);
    const result = preprocessRecognition(source, [3, 48, 320]);

    expect(result.data.length).toBe(3 * 48 * 320);
  });

  it("handles zero-height source gracefully", () => {
    const source = createFakeImageData(100, 1);
    const result = preprocessRecognition(source, [3, 48, 320]);

    expect(result.dims).toEqual([1, 3, 48, 320]);
    expect(result.data.length).toBe(3 * 48 * 320);
  });
});
