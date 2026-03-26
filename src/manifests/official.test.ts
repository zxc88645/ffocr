import { describe, it, expect } from "vitest";
import {
  createPPOcrV5BrowserManifest,
  DEFAULT_DICTIONARY_URL,
  PPOCRV5_MODEL_PATHS
} from "./official";

describe("model path constants", () => {
  it("defines server and mobile detection paths", () => {
    expect(PPOCRV5_MODEL_PATHS.detection.server).toBe("det_server.onnx");
    expect(PPOCRV5_MODEL_PATHS.detection.mobile).toBe("det_mobile.onnx");
  });

  it("defines server and mobile recognition paths", () => {
    expect(PPOCRV5_MODEL_PATHS.recognition.server).toBe("rec_server.onnx");
    expect(PPOCRV5_MODEL_PATHS.recognition.mobile).toBe("rec_mobile.onnx");
  });
});

describe("createPPOcrV5BrowserManifest", () => {
  it("defaults to mobile variant", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models"
    });

    expect(manifest.id).toBe("pp-ocrv5-mobile-browser");
    expect(manifest.detection.url).toBe("https://example.com/models/det_mobile.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec_mobile.onnx");
    expect(manifest.dictionary).toEqual({ url: DEFAULT_DICTIONARY_URL });
  });

  it("uses mobile models when variant is mobile", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models",
      modelVariant: "mobile"
    });

    expect(manifest.id).toBe("pp-ocrv5-mobile-browser");
    expect(manifest.detection.url).toBe("https://example.com/models/det_mobile.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec_mobile.onnx");
  });

  it("uses server models when variant is explicitly server", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models",
      modelVariant: "server"
    });

    expect(manifest.id).toBe("pp-ocrv5-browser");
    expect(manifest.detection.url).toBe("https://example.com/models/det_server.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec_server.onnx");
  });

  it("explicit model paths override variant", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com",
      modelVariant: "mobile",
      detectionModelPath: "custom_det.onnx",
      recognitionModelPath: "custom_rec.onnx"
    });

    expect(manifest.detection.url).toBe("https://example.com/custom_det.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/custom_rec.onnx");
  });

  it("strips trailing slash from baseUrl", () => {
    const manifest = createPPOcrV5BrowserManifest({
      baseUrl: "https://example.com/models/"
    });

    expect(manifest.detection.url).toBe("https://example.com/models/det_mobile.onnx");
    expect(manifest.recognition.url).toBe("https://example.com/models/rec_mobile.onnx");
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

    expect(manifest.detectionLimitSideLen).toBe(960);
    expect(manifest.detectionThreshold).toBe(0.3);
    expect(manifest.detectionBoxThreshold).toBe(0.6);
    expect(manifest.detectionUnclipRatio).toBe(1.5);
    expect(manifest.detectionMinSize).toBe(3);
    expect(manifest.recognitionImageShape).toEqual([3, 48, 320]);
  });
});
