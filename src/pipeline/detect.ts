import type { OcrBox } from "../types";
import { clamp } from "../utils/math";

export interface DetectionPostprocessOptions {
  sourceWidth: number;
  sourceHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  threshold: number;
  boxThreshold: number;
  unclipRatio: number;
  minSize: number;
}

interface ComponentBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixels: number;
  scoreSum: number;
}

function createAxisAlignedBox(
  component: ComponentBox,
  options: DetectionPostprocessOptions
): OcrBox | null {
  const width = component.maxX - component.minX + 1;
  const height = component.maxY - component.minY + 1;
  const score = component.scoreSum / component.pixels;

  if (width < options.minSize || height < options.minSize || score < options.boxThreshold) {
    return null;
  }

  const distance =
    ((width * height) * options.unclipRatio) / Math.max(2 * (width + height), 1);
  const left = clamp(component.minX - distance, 0, options.resizedWidth - 1);
  const top = clamp(component.minY - distance, 0, options.resizedHeight - 1);
  const right = clamp(component.maxX + distance, 0, options.resizedWidth - 1);
  const bottom = clamp(component.maxY + distance, 0, options.resizedHeight - 1);
  const scaleX = options.sourceWidth / options.resizedWidth;
  const scaleY = options.sourceHeight / options.resizedHeight;

  return {
    score,
    points: [
      { x: left * scaleX, y: top * scaleY },
      { x: right * scaleX, y: top * scaleY },
      { x: right * scaleX, y: bottom * scaleY },
      { x: left * scaleX, y: bottom * scaleY }
    ]
  };
}

function normalizeProbabilityMap(
  raw: Float32Array,
  dims: readonly number[]
): { map: Float32Array; height: number; width: number } {
  if (dims.length === 4) {
    return {
      map: raw,
      height: dims[2] ?? 0,
      width: dims[3] ?? 0
    };
  }

  if (dims.length === 3) {
    return {
      map: raw,
      height: dims[1] ?? 0,
      width: dims[2] ?? 0
    };
  }

  throw new Error(`Unsupported detection output shape: ${dims.join("x")}`);
}

export function postprocessDetection(
  raw: Float32Array,
  dims: readonly number[],
  options: DetectionPostprocessOptions
): OcrBox[] {
  const { map, height, width } = normalizeProbabilityMap(raw, dims);
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  const results: OcrBox[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const root = y * width + x;
      if (visited[root] || map[root] < options.threshold) {
        continue;
      }

      let head = 0;
      let tail = 0;
      let component: ComponentBox = {
        minX: x,
        minY: y,
        maxX: x,
        maxY: y,
        pixels: 0,
        scoreSum: 0
      };

      visited[root] = 1;
      queue[tail] = root;
      tail += 1;

      while (head < tail) {
        const current = queue[head];
        head += 1;
        const cx = current % width;
        const cy = Math.floor(current / width);

        component.minX = Math.min(component.minX, cx);
        component.minY = Math.min(component.minY, cy);
        component.maxX = Math.max(component.maxX, cx);
        component.maxY = Math.max(component.maxY, cy);
        component.pixels += 1;
        component.scoreSum += map[current];

        for (let ny = cy - 1; ny <= cy + 1; ny += 1) {
          if (ny < 0 || ny >= height) {
            continue;
          }

          for (let nx = cx - 1; nx <= cx + 1; nx += 1) {
            if (nx < 0 || nx >= width) {
              continue;
            }

            const next = ny * width + nx;
            if (visited[next] || map[next] < options.threshold) {
              continue;
            }

            visited[next] = 1;
            queue[tail] = next;
            tail += 1;
          }
        }
      }

      const box = createAxisAlignedBox(component, options);
      if (box) {
        results.push(box);
      }
    }
  }

  return results;
}
