import { describe, it, expect } from "vitest";
import { createPPOcrV5BrowserManifest, DEFAULT_DICTIONARY_URL } from "./official";

describe("createPPOcrV5BrowserManifest", () => {
  it("creates manifest with default model paths", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models"
    });

    expect(manifest.id).toBe("pp-ocrv5-browser");
    expect(manifest.detection.url).toBe("https://example.com/models/det.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec.onnx");
    expect(manifest.dictionary).toEqual({ url: DEFAULT_DICTIONARY_URL });
  });

  it("strips trailing slash from baseUrl", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models/"
    });

    expect(manifest.detection.url).toBe("https://example.com/models/det.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec.onnx");
  });

  it("uses custom model paths", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com",
      detectionModelPath: "custom_det.onnx",
      recognitionModelPath: "custom_rec.onnx"
    });

    expect(manifest.detection.url).toBe("https://example.com/custom_det.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/custom_rec.onnx");
  });

  it("uses custom dictionary URL", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com",
      dictionaryUrl: "https://example.com/dict.txt"
    });

    expect(manifest.dictionary).toEqual({ url: "https://example.com/dict.txt" });
  });

  it("sets correct default hyperparameters", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com"
    });

    expect(manifest.detectionLimitSideLen).toBe(736);
    expect(manifest.detectionThreshold).toBe(0.3);
    expect(manifest.detectionBoxThreshold).toBe(0.6);
    expect(manifest.detectionUnclipRatio).toBe(1.8);
    expect(manifest.detectionMinSize).toBe(3);
    expect(manifest.recognitionImageShape).toEqual([3, 48, 320]);
  });
});
