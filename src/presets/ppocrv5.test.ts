import { describe, it, expect } from "vitest";
import {
  createPPOcrV5,
  createDefaultPPOcrV5,
  DEFAULT_MODEL_BASE_URL,
  DEFAULT_MODEL_RELEASE_TAG,
  DEFAULT_ORT_WASM_PATHS
} from "./ppocrv5";

describe("constants", () => {
  it("DEFAULT_ORT_WASM_PATHS points to jsdelivr CDN", () => {
    expect(DEFAULT_ORT_WASM_PATHS).toContain("jsdelivr.net");
    expect(DEFAULT_ORT_WASM_PATHS).toContain("onnxruntime-web");
  });

  it("DEFAULT_MODEL_RELEASE_TAG is a non-empty string", () => {
    expect(DEFAULT_MODEL_RELEASE_TAG).toBeTruthy();
    expect(typeof DEFAULT_MODEL_RELEASE_TAG).toBe("string");
  });

  it("DEFAULT_MODEL_BASE_URL points to GitHub Pages", () => {
    expect(DEFAULT_MODEL_BASE_URL).toContain("github.io");
    expect(DEFAULT_MODEL_BASE_URL).toContain("ffocr");
  });
});

describe("createPPOcrV5", () => {
  it("returns a PaddleOcrWeb instance", () => {
    const instance = createPPOcrV5({
      baseUrl: "https://example.com/models"
    });
    expect(instance).toBeDefined();
    expect(typeof instance.ocr).toBe("function");
    expect(typeof instance.init).toBe("function");
    expect(typeof instance.dispose).toBe("function");
  });

  it("can be disposed immediately without error", () => {
    const instance = createPPOcrV5({
      baseUrl: "https://example.com/models"
    });
    expect(() => instance.dispose()).not.toThrow();
  });

  it("accepts modelVariant option", () => {
    const mobile = createPPOcrV5({
      baseUrl: "https://example.com/models",
      modelVariant: "mobile"
    });
    expect(mobile).toBeDefined();
    expect(typeof mobile.ocr).toBe("function");

    const server = createPPOcrV5({
      baseUrl: "https://example.com/models",
      modelVariant: "server"
    });
    expect(server).toBeDefined();
  });
});

describe("createDefaultPPOcrV5", () => {
  it("returns a PaddleOcrWeb instance with default base URL", () => {
    const instance = createDefaultPPOcrV5();
    expect(instance).toBeDefined();
    expect(typeof instance.ocr).toBe("function");
  });

  it("accepts optional overrides", () => {
    const instance = createDefaultPPOcrV5({
      providerPreference: "wasm"
    });
    expect(instance).toBeDefined();
  });

  it("accepts modelVariant override", () => {
    const instance = createDefaultPPOcrV5({
      modelVariant: "mobile"
    });
    expect(instance).toBeDefined();
  });
});
