import type { OcrBox } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundUpToMultiple(value: number, multiple: number): number {
  return Math.max(multiple, Math.ceil(value / multiple) * multiple);
}

export function sortBoxes(boxes: readonly OcrBox[]): OcrBox[] {
  return [...boxes].sort((left, right) => {
    const ly = left.points[0].y;
    const ry = right.points[0].y;
    if (Math.abs(ly - ry) > 12) {
      return ly - ry;
    }

    return left.points[0].x - right.points[0].x;
  });
}

export function axisAlignedBounds(box: OcrBox): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const xs = box.points.map((point) => point.x);
  const ys = box.points.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

export function maxIndex(values: ArrayLike<number>): { index: number; value: number } {
  let index = 0;
  let value = values[0] ?? Number.NEGATIVE_INFINITY;

  for (let cursor = 1; cursor < values.length; cursor += 1) {
    if (values[cursor] > value) {
      index = cursor;
      value = values[cursor];
    }
  }

  return { index, value };
}

export function maxProbability(values: ArrayLike<number>): number {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let cursor = 0; cursor < values.length; cursor += 1) {
    const value = values[cursor];
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  if (min >= 0 && max <= 1) {
    return max;
  }

  let total = 0;
  for (let cursor = 0; cursor < values.length; cursor += 1) {
    total += Math.exp(values[cursor] - max);
  }

  return 1 / total;
}
