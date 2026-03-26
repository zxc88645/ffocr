import { describe, it, expect } from "vitest";
import { postprocessDetection, type DetectionPostprocessOptions } from "./detect";

function makeOptions(overrides: Partial<DetectionPostprocessOptions> = {}): DetectionPostprocessOptions {
  return {
    sourceWidth: 100,
    sourceHeight: 100,
    resizedWidth: 100,
    resizedHeight: 100,
    threshold: 0.3,
    boxThreshold: 0.5,
    unclipRatio: 1.8,
    minSize: 3,
    ...overrides
  };
}

describe("postprocessDetection", () => {
  it("returns empty array for all-zero probability map", () => {
    const width = 10;
    const height = 10;
    const map = new Float32Array(width * height);
    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      resizedWidth: width,
      resizedHeight: height
    }));
    expect(result).toEqual([]);
  });

  it("returns empty array when no pixel exceeds threshold", () => {
    const width = 10;
    const height = 10;
    const map = new Float32Array(width * height).fill(0.2);
    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      resizedWidth: width,
      resizedHeight: height
    }));
    expect(result).toEqual([]);
  });

  it("detects a single connected region", () => {
    const width = 20;
    const height = 20;
    const map = new Float32Array(width * height);

    for (let y = 5; y <= 15; y++) {
      for (let x = 5; x <= 15; x++) {
        map[y * width + x] = 0.8;
      }
    }

    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      sourceWidth: 20,
      sourceHeight: 20,
      resizedWidth: width,
      resizedHeight: height,
      boxThreshold: 0.5,
      minSize: 3
    }));

    expect(result.length).toBe(1);
    expect(result[0].score).toBeCloseTo(0.8, 1);
    expect(result[0].points).toHaveLength(4);
  });

  it("detects two separate regions", () => {
    const width = 40;
    const height = 20;
    const map = new Float32Array(width * height);

    for (let y = 2; y <= 8; y++) {
      for (let x = 2; x <= 8; x++) {
        map[y * width + x] = 0.9;
      }
    }
    for (let y = 2; y <= 8; y++) {
      for (let x = 30; x <= 38; x++) {
        map[y * width + x] = 0.7;
      }
    }

    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      sourceWidth: 40,
      sourceHeight: 20,
      resizedWidth: width,
      resizedHeight: height,
      boxThreshold: 0.5,
      minSize: 3
    }));

    expect(result.length).toBe(2);
  });

  it("filters out regions smaller than minSize", () => {
    const width = 20;
    const height = 20;
    const map = new Float32Array(width * height);

    map[5 * width + 5] = 0.9;
    map[5 * width + 6] = 0.9;

    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      sourceWidth: 20,
      sourceHeight: 20,
      resizedWidth: width,
      resizedHeight: height,
      minSize: 5
    }));

    expect(result.length).toBe(0);
  });

  it("filters out regions below boxThreshold", () => {
    const width = 20;
    const height = 20;
    const map = new Float32Array(width * height);

    for (let y = 3; y <= 10; y++) {
      for (let x = 3; x <= 10; x++) {
        map[y * width + x] = 0.35;
      }
    }

    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      sourceWidth: 20,
      sourceHeight: 20,
      resizedWidth: width,
      resizedHeight: height,
      boxThreshold: 0.5
    }));

    expect(result.length).toBe(0);
  });

  it("scales box coordinates from resized to source dimensions", () => {
    const width = 20;
    const height = 20;
    const map = new Float32Array(width * height);

    for (let y = 5; y <= 14; y++) {
      for (let x = 5; x <= 14; x++) {
        map[y * width + x] = 0.9;
      }
    }

    const result = postprocessDetection(map, [1, 1, height, width], makeOptions({
      sourceWidth: 200,
      sourceHeight: 200,
      resizedWidth: width,
      resizedHeight: height,
      boxThreshold: 0.5,
      minSize: 3
    }));

    expect(result.length).toBe(1);
    const box = result[0];
    for (const point of box.points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(200);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(200);
    }
  });

  it("supports 3-dimensional output shape", () => {
    const width = 10;
    const height = 10;
    const map = new Float32Array(width * height);

    for (let y = 2; y <= 7; y++) {
      for (let x = 2; x <= 7; x++) {
        map[y * width + x] = 0.8;
      }
    }

    const result = postprocessDetection(map, [1, height, width], makeOptions({
      sourceWidth: 10,
      sourceHeight: 10,
      resizedWidth: width,
      resizedHeight: height
    }));

    expect(result.length).toBe(1);
  });

  it("throws on unsupported output shape", () => {
    expect(() =>
      postprocessDetection(new Float32Array(10), [10], makeOptions())
    ).toThrow("Unsupported detection output shape");
  });
});
