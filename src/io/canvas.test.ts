import { describe, it, expect } from "vitest";
import { cropImageData } from "./canvas";

function createTestImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      data[offset] = x;       // R = x coordinate
      data[offset + 1] = y;   // G = y coordinate
      data[offset + 2] = 128; // B
      data[offset + 3] = 255; // A
    }
  }
  return new ImageData(data, width, height);
}

describe("cropImageData", () => {
  it("crops a region from the center", () => {
    const source = createTestImageData(100, 100);
    const cropped = cropImageData(source, 10, 20, 30, 40);

    expect(cropped.width).toBe(30);
    expect(cropped.height).toBe(40);

    const firstPixel = [cropped.data[0], cropped.data[1], cropped.data[2], cropped.data[3]];
    expect(firstPixel).toEqual([10, 20, 128, 255]);
  });

  it("clamps to source boundaries", () => {
    const source = createTestImageData(50, 50);
    const cropped = cropImageData(source, -5, -5, 20, 20);

    expect(cropped.width).toBeLessThanOrEqual(20);
    expect(cropped.height).toBeLessThanOrEqual(20);
    expect(cropped.data.length).toBe(cropped.width * cropped.height * 4);
  });

  it("produces minimum 1x1 output", () => {
    const source = createTestImageData(10, 10);
    const cropped = cropImageData(source, 5, 5, 0.1, 0.1);

    expect(cropped.width).toBeGreaterThanOrEqual(1);
    expect(cropped.height).toBeGreaterThanOrEqual(1);
  });

  it("handles crop at the edge", () => {
    const source = createTestImageData(100, 100);
    const cropped = cropImageData(source, 90, 90, 50, 50);

    expect(cropped.width).toBeLessThanOrEqual(100);
    expect(cropped.height).toBeLessThanOrEqual(100);
    expect(cropped.data.length).toBe(cropped.width * cropped.height * 4);
  });

  it("returns exact pixels for known coordinates", () => {
    const source = createTestImageData(20, 20);
    const cropped = cropImageData(source, 5, 5, 3, 3);

    expect(cropped.width).toBe(3);
    expect(cropped.height).toBe(3);

    // First row, first pixel should be (5, 5)
    expect(cropped.data[0]).toBe(5);  // R = x = 5
    expect(cropped.data[1]).toBe(5);  // G = y = 5

    // First row, second pixel should be (6, 5)
    expect(cropped.data[4]).toBe(6);  // R = x = 6
    expect(cropped.data[5]).toBe(5);  // G = y = 5

    // Second row, first pixel should be (5, 6)
    const row2Offset = 3 * 4; // width * 4
    expect(cropped.data[row2Offset]).toBe(5);     // R = x = 5
    expect(cropped.data[row2Offset + 1]).toBe(6); // G = y = 6
  });
});
