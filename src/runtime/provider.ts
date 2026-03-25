import type {
  ExecutionProvider,
  PaddleOcrModelManifest,
  ProviderPreference,
  RuntimeBenchmark
} from "../types";

const STORAGE_PREFIX = "ffocr:provider:";

function normalizePreference(preference: ProviderPreference | undefined): ExecutionProvider[] {
  if (!preference || preference === "auto") {
    const providers: ExecutionProvider[] = [];
    if (supportsWebGpu()) {
      providers.push("webgpu");
    }
    providers.push("wasm");
    return providers;
  }

  if (preference === "webgpu" || preference === "wasm") {
    return [preference];
  }

  return [...preference];
}

export function getProviderCandidates(
  preference: ProviderPreference | undefined
): ExecutionProvider[] {
  return normalizePreference(preference).filter(
    (value, index, array) => array.indexOf(value) === index
  );
}

export function supportsWebGpu(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function buildProviderCacheKey(manifest: PaddleOcrModelManifest): string {
  const userAgent = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;
  return `${STORAGE_PREFIX}${manifest.id}:${userAgent}`;
}

export function readCachedProvider(cacheKey: string): ExecutionProvider | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const cached = localStorage.getItem(cacheKey);
  if (cached === "webgpu" || cached === "wasm") {
    return cached;
  }

  return null;
}

export function writeCachedProvider(
  cacheKey: string,
  provider: ExecutionProvider,
  benchmarks: readonly RuntimeBenchmark[]
): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(cacheKey, provider);
  localStorage.setItem(`${cacheKey}:benchmarks`, JSON.stringify(benchmarks));
}
