import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getProviderCandidates,
  getKnownExecutionProviders,
  getExecutionProviderSupport,
  getAvailableExecutionProviders,
  isExecutionProviderAvailable,
  supportsWasm,
  supportsWebGpu,
  supportsWebNN,
  supportsWebGl,
  buildProviderCacheKey,
  readCachedProvider,
  writeCachedProvider
} from "./provider";

describe("getKnownExecutionProviders", () => {
  it("returns all four known providers in priority order", () => {
    const providers = getKnownExecutionProviders();
    expect(providers).toEqual(["webgpu", "webnn", "webgl", "wasm"]);
  });
});

describe("supportsWasm", () => {
  it("returns true when WebAssembly is defined", () => {
    expect(supportsWasm()).toBe(true);
  });
});

describe("supportsWebGpu", () => {
  it("returns false in Node.js (no navigator.gpu)", () => {
    expect(supportsWebGpu()).toBe(false);
  });
});

describe("supportsWebNN", () => {
  it("returns false in Node.js (no navigator.ml)", () => {
    expect(supportsWebNN()).toBe(false);
  });
});

describe("supportsWebGl", () => {
  it("returns false in Node.js (no canvas support)", () => {
    expect(supportsWebGl()).toBe(false);
  });
});

describe("isExecutionProviderAvailable", () => {
  it("returns true for wasm in Node.js", () => {
    expect(isExecutionProviderAvailable("wasm")).toBe(true);
  });

  it("returns false for webgpu in Node.js", () => {
    expect(isExecutionProviderAvailable("webgpu")).toBe(false);
  });

  it("returns false for unknown provider", () => {
    expect(isExecutionProviderAvailable("unknown" as any)).toBe(false);
  });
});

describe("getAvailableExecutionProviders", () => {
  it("includes wasm in Node.js", () => {
    const available = getAvailableExecutionProviders();
    expect(available).toContain("wasm");
  });
});

describe("getExecutionProviderSupport", () => {
  it("returns support info for all known providers", () => {
    const support = getExecutionProviderSupport();
    expect(support).toHaveLength(4);
    const wasmEntry = support.find((s) => s.provider === "wasm");
    expect(wasmEntry?.available).toBe(true);
  });
});

describe("getProviderCandidates", () => {
  it("returns available providers for 'auto'", () => {
    const candidates = getProviderCandidates("auto");
    expect(candidates).toContain("wasm");
  });

  it("returns available providers when preference is undefined", () => {
    const candidates = getProviderCandidates(undefined);
    expect(candidates).toContain("wasm");
  });

  it("wraps a single string preference", () => {
    const candidates = getProviderCandidates("webgpu");
    expect(candidates).toEqual(["webgpu"]);
  });

  it("preserves array order and deduplicates", () => {
    const candidates = getProviderCandidates(["wasm", "webgpu", "wasm"]);
    expect(candidates).toEqual(["wasm", "webgpu"]);
  });
});

describe("buildProviderCacheKey", () => {
  it("builds a key from manifest id", () => {
    const key = buildProviderCacheKey({
      id: "test-model",
      detection: { url: "" },
      recognition: { url: "" },
      dictionary: { url: "" }
    });
    expect(key).toContain("test-model");
    expect(key).toMatch(/^ffocr:provider:/);
  });
});

describe("readCachedProvider / writeCachedProvider", () => {
  it("returns null when localStorage is unavailable (Node.js)", () => {
    expect(readCachedProvider("some-key")).toBeNull();
  });

  it("writeCachedProvider does not throw when localStorage is unavailable", () => {
    expect(() =>
      writeCachedProvider("key", "wasm", [])
    ).not.toThrow();
  });
});
