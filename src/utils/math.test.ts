import { describe, it, expect } from "vitest";
import { clamp, roundUpToMultiple, sortBoxes, axisAlignedBounds, maxIndex, maxProbability } from "./math";
import type { OcrBox } from "../types";

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it("handles negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-20, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe("roundUpToMultiple", () => {
  it("returns the multiple when value is smaller", () => {
    expect(roundUpToMultiple(10, 32)).toBe(32);
  });

  it("returns the value when already a multiple", () => {
    expect(roundUpToMultiple(64, 32)).toBe(64);
  });

  it("rounds up to the next multiple", () => {
    expect(roundUpToMultiple(33, 32)).toBe(64);
    expect(roundUpToMultiple(50, 32)).toBe(64);
  });

  it("ensures minimum is the multiple itself", () => {
    expect(roundUpToMultiple(0, 32)).toBe(32);
    expect(roundUpToMultiple(1, 32)).toBe(32);
  });
});

describe("sortBoxes", () => {
  function makeBox(x: number, y: number, score = 0.9): OcrBox {
    return {
      score,
      points: [
        { x, y },
        { x: x + 50, y },
        { x: x + 50, y: y + 20 },
        { x, y: y + 20 }
      ]
    };
  }

  it("sorts by y coordinate primarily", () => {
    const boxes = [makeBox(10, 100), makeBox(10, 0), makeBox(10, 50)];
    const sorted = sortBoxes(boxes);
    expect(sorted[0].points[0].y).toBe(0);
    expect(sorted[1].points[0].y).toBe(50);
    expect(sorted[2].points[0].y).toBe(100);
  });

  it("sorts by x coordinate when y values are close (within 12px)", () => {
    const boxes = [makeBox(100, 5), makeBox(10, 0), makeBox(50, 3)];
    const sorted = sortBoxes(boxes);
    expect(sorted[0].points[0].x).toBe(10);
    expect(sorted[1].points[0].x).toBe(50);
    expect(sorted[2].points[0].x).toBe(100);
  });

  it("does not mutate the original array", () => {
    const boxes = [makeBox(10, 100), makeBox(10, 0)];
    const original = [...boxes];
    sortBoxes(boxes);
    expect(boxes).toEqual(original);
  });

  it("returns an empty array for empty input", () => {
    expect(sortBoxes([])).toEqual([]);
  });
});

describe("axisAlignedBounds", () => {
  it("computes bounding box for axis-aligned rectangle", () => {
    const box: OcrBox = {
      score: 0.9,
      points: [
        { x: 10, y: 20 },
        { x: 60, y: 20 },
        { x: 60, y: 50 },
        { x: 10, y: 50 }
      ]
    };

    const bounds = axisAlignedBounds(box);
    expect(bounds.left).toBe(10);
    expect(bounds.top).toBe(20);
    expect(bounds.width).toBe(50);
    expect(bounds.height).toBe(30);
  });

  it("handles rotated quadrilateral", () => {
    const box: OcrBox = {
      score: 0.8,
      points: [
        { x: 30, y: 10 },
        { x: 60, y: 30 },
        { x: 40, y: 60 },
        { x: 10, y: 40 }
      ]
    };

    const bounds = axisAlignedBounds(box);
    expect(bounds.left).toBe(10);
    expect(bounds.top).toBe(10);
    expect(bounds.width).toBe(50);
    expect(bounds.height).toBe(50);
  });

  it("handles zero-size box (all points the same)", () => {
    const box: OcrBox = {
      score: 1,
      points: [
        { x: 5, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 5 }
      ]
    };

    const bounds = axisAlignedBounds(box);
    expect(bounds.left).toBe(5);
    expect(bounds.top).toBe(5);
    expect(bounds.width).toBe(0);
    expect(bounds.height).toBe(0);
  });
});

describe("maxIndex", () => {
  it("returns the index and value of the maximum element", () => {
    const result = maxIndex(new Float32Array([1, 5, 3, 2]));
    expect(result.index).toBe(1);
    expect(result.value).toBe(5);
  });

  it("returns the first occurrence when there are ties", () => {
    const result = maxIndex(new Float32Array([3, 3, 1]));
    expect(result.index).toBe(0);
    expect(result.value).toBe(3);
  });

  it("works with negative values", () => {
    const result = maxIndex(new Float32Array([-10, -5, -20]));
    expect(result.index).toBe(1);
    expect(result.value).toBe(-5);
  });

  it("works with a single element", () => {
    const result = maxIndex(new Float32Array([42]));
    expect(result.index).toBe(0);
    expect(result.value).toBe(42);
  });

  it("works with regular arrays", () => {
    const result = maxIndex([10, 20, 5]);
    expect(result.index).toBe(1);
    expect(result.value).toBe(20);
  });
});

describe("maxProbability", () => {
  it("returns the max directly when values are in [0, 1]", () => {
    const result = maxProbability(new Float32Array([0.1, 0.7, 0.3]));
    expect(result).toBeCloseTo(0.7);
  });

  it("computes softmax-like probability for raw logits", () => {
    const result = maxProbability(new Float32Array([2.0, 5.0, 1.0]));
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("returns 1 for a single-class probability in [0, 1]", () => {
    expect(maxProbability(new Float32Array([0.9]))).toBeCloseTo(0.9);
  });

  it("handles all-zero probabilities", () => {
    const result = maxProbability(new Float32Array([0, 0, 0]));
    expect(result).toBeCloseTo(0);
  });

  it("handles logits with large spread", () => {
    const result = maxProbability(new Float32Array([0, 0, 100]));
    expect(result).toBeCloseTo(1, 4);
  });
});
