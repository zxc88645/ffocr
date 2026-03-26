import { describe, it, expect, vi, beforeEach } from "vitest";

const { DICTIONARY, NUM_CLASSES, IMAGE_W, IMAGE_H } = vi.hoisted(() => ({
  DICTIONARY: ["H", "e", "l", "o", "W", "r", "d"],
  NUM_CLASSES: 8,
  IMAGE_W: 100,
  IMAGE_H: 50
}));

vi.mock("./runtime/ort", () => ({
  configureOrt: vi.fn(),
  createSession: vi.fn(async (url: string) => ({
    _type: url.includes("det") ? "det" : "rec",
    inputNames: ["x"],
    outputNames: ["output"]
  })),
  runSession: vi.fn(async (session: any, _data: Float32Array, dims: readonly number[]) => {
    if (session._type === "det") {
      const h = dims[2] as number;
      const w = dims[3] as number;
      const map = new Float32Array(h * w);
      for (let y = 2; y < Math.min(12, h); y++) {
        for (let x = 5; x < Math.min(40, w); x++) {
          map[y * w + x] = 0.9;
        }
      }
      return { data: map, dims: [1, 1, h, w] };
    }

    const batchSize = dims[0] as number;
    const timeSteps = 4;
    const data = new Float32Array(batchSize * timeSteps * NUM_CLASSES);
    const targets = [1, 2, 3, 4]; // H, e, l, o
    for (let b = 0; b < batchSize; b++) {
      for (let t = 0; t < timeSteps; t++) {
        for (let c = 0; c < NUM_CLASSES; c++) {
          data[(b * timeSteps + t) * NUM_CLASSES + c] = c === targets[t] ? 10 : -10;
        }
      }
    }
    return { data, dims: [batchSize, timeSteps, NUM_CLASSES] };
  })
}));

vi.mock("./io/canvas", () => ({
  ensureImageData: vi.fn(async () =>
    new ImageData(new Uint8ClampedArray(IMAGE_W * IMAGE_H * 4).fill(128), IMAGE_W, IMAGE_H)
  ),
  cropImageData: vi.fn((_src: any, _l: number, _t: number, w: number, h: number) => {
    const cw = Math.max(1, Math.ceil(w));
    const ch = Math.max(1, Math.ceil(h));
    return new ImageData(new Uint8ClampedArray(cw * ch * 4).fill(128), cw, ch);
  }),
  resizeImageData: vi.fn((_src: any, w: number, h: number) =>
    new ImageData(new Uint8ClampedArray(w * h * 4).fill(128), w, h)
  )
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  createPaddleOcr,
  createDefaultPPOcrV5,
  createPPOcrV5,
  ocrWithDefaultPPOcrV5,
  ocrWithPPOcrV5
} from "./index";
import { createSession } from "./runtime/ort";
import type { PaddleOcrModelManifest } from "./types";

function makeManifest(overrides: Partial<PaddleOcrModelManifest> = {}): PaddleOcrModelManifest {
  return {
    id: "test",
    detection: { url: "https://example.com/det.onnx" },
    recognition: { url: "https://example.com/rec.onnx" },
    dictionary: DICTIONARY,
    detectionLimitSideLen: 960,
    detectionThreshold: 0.3,
    detectionBoxThreshold: 0.5,
    detectionUnclipRatio: 1.5,
    detectionMinSize: 3,
    recognitionImageShape: [3, 48, 320],
    ...overrides
  };
}

function makeImage() {
  return new ImageData(new Uint8ClampedArray(IMAGE_W * IMAGE_H * 4).fill(200), IMAGE_W, IMAGE_H);
}

describe("OCR integration – user-facing API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => DICTIONARY.join("\n")
    });
  });

  describe("createPaddleOcr → ocr()", () => {
    it("runs full pipeline and returns structured OcrResult", async () => {
      const ocr = createPaddleOcr({
        manifest: makeManifest(),
        providerPreference: "wasm"
      });

      const result = await ocr.ocr(makeImage());

      expect(result.text).toBe("Helo");
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].text).toBe("Helo");
      expect(result.lines[0].score).toBeGreaterThan(0);
      expect(result.lines[0].box.points).toHaveLength(4);
      expect(result.lines[0].box.score).toBeGreaterThan(0);
      expect(result.image).toEqual({ width: IMAGE_W, height: IMAGE_H });
      expect(result.runtime.provider).toBe("wasm");
      expect(result.runtime.candidates).toContain("wasm");

      ocr.dispose();
    });

    it("only initialises once across multiple ocr() calls", async () => {
      const ocr = createPaddleOcr({
        manifest: makeManifest(),
        providerPreference: "wasm"
      });

      await ocr.ocr(makeImage());
      await ocr.ocr(makeImage());

      expect(createSession).toHaveBeenCalledTimes(2);

      ocr.dispose();
    });

    it("getRuntimeSelection() is null before init, populated after", async () => {
      const ocr = createPaddleOcr({
        manifest: makeManifest(),
        providerPreference: "wasm"
      });

      expect(ocr.getRuntimeSelection()).toBeNull();
      await ocr.ocr(makeImage());
      expect(ocr.getRuntimeSelection()?.provider).toBe("wasm");

      ocr.dispose();
    });

    it("returns empty result when no region exceeds threshold", async () => {
      const ocr = createPaddleOcr({
        manifest: makeManifest({ detectionBoxThreshold: 0.95 }),
        providerPreference: "wasm"
      });

      const result = await ocr.ocr(makeImage());

      expect(result.text).toBe("");
      expect(result.lines).toHaveLength(0);
      expect(result.image).toEqual({ width: IMAGE_W, height: IMAGE_H });

      ocr.dispose();
    });
  });

  describe("createDefaultPPOcrV5 → ocr()  (README quick-start)", () => {
    it("works end-to-end with a URL string input", async () => {
      // Mirrors the README usage:
      //   const ocr = createDefaultPPOcrV5();
      //   const result = await ocr.ocr("https://…/photo.png");
      //   console.log(result.text);
      const ocr = createDefaultPPOcrV5();
      const result = await ocr.ocr("https://example.com/photo.png");

      expect(result.text).toBeTruthy();
      expect(result.lines.length).toBeGreaterThan(0);
      expect(result.lines[0].text).toBeTruthy();
      expect(result.lines[0].score).toBeGreaterThan(0);
      expect(result.lines[0].box.points).toHaveLength(4);
      expect(result.image.width).toBe(IMAGE_W);
      expect(result.image.height).toBe(IMAGE_H);
      expect(result.runtime.provider).toBeDefined();

      ocr.dispose();
    });
  });

  describe("createPPOcrV5 → ocr()", () => {
    it("works with a custom baseUrl", async () => {
      const ocr = createPPOcrV5({ baseUrl: "https://my-cdn.com/models" });
      const result = await ocr.ocr(makeImage());

      expect(result.text).toBeTruthy();
      expect(result.lines.length).toBeGreaterThan(0);

      ocr.dispose();
    });
  });

  describe("ocrWithDefaultPPOcrV5 (one-shot)", () => {
    it("returns result without manual lifecycle management", async () => {
      const result = await ocrWithDefaultPPOcrV5("https://example.com/image.jpg");

      expect(result.text).toBeTruthy();
      expect(result.lines.length).toBeGreaterThan(0);
      expect(result.image.width).toBe(IMAGE_W);
      expect(result.image.height).toBe(IMAGE_H);
    });
  });

  describe("ocrWithPPOcrV5 (one-shot with options)", () => {
    it("returns result with custom base URL", async () => {
      const result = await ocrWithPPOcrV5(
        "https://example.com/image.jpg",
        { baseUrl: "https://my-cdn.com/models" }
      );

      expect(result.text).toBeTruthy();
      expect(result.lines.length).toBeGreaterThan(0);
    });
  });
});
