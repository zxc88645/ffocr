import type {
  ExecutionProvider,
  ExecutionProviderSupport,
  PaddleOcrModelManifest,
  ProviderPreference,
  RuntimeBenchmark
} from "../types";

const STORAGE_PREFIX = "ffocr:provider:";
const EXECUTION_PROVIDER_PRIORITY: readonly ExecutionProvider[] = [
  "webgpu",
  "webnn",
  "webgl",
  "wasm"
];

function normalizePreference(preference: ProviderPreference | undefined): ExecutionProvider[] {
  if (!preference || preference === "auto") {
    const available = getAvailableExecutionProviders();
    return available.length > 0 ? available : ["wasm"];
  }

  if (typeof preference === "string") {
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

export function getKnownExecutionProviders(): readonly ExecutionProvider[] {
  return EXECUTION_PROVIDER_PRIORITY;
}

export function getExecutionProviderSupport(): readonly ExecutionProviderSupport[] {
  return EXECUTION_PROVIDER_PRIORITY.map((provider) => ({
    provider,
    available: isExecutionProviderAvailable(provider)
  }));
}

export function getAvailableExecutionProviders(): ExecutionProvider[] {
  return getExecutionProviderSupport()
    .filter((item) => item.available)
    .map((item) => item.provider);
}

export function isExecutionProviderAvailable(provider: ExecutionProvider): boolean {
  switch (provider) {
    case "webgpu":
      return supportsWebGpu();
    case "webnn":
      return supportsWebNN();
    case "webgl":
      return supportsWebGl();
    case "wasm":
      return supportsWasm();
    default:
      return false;
  }
}

export function supportsWebGpu(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function supportsWebNN(): boolean {
  return typeof navigator !== "undefined" && "ml" in navigator;
}

export function supportsWebGl(): boolean {
  const canvas = createProbeCanvas();
  if (!canvas) {
    return false;
  }

  try {
    const standardContext = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (standardContext) {
      return true;
    }

    return typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement
      ? Boolean(canvas.getContext("experimental-webgl"))
      : false;
  } catch {
    return false;
  }
}

export function supportsWasm(): boolean {
  return typeof WebAssembly !== "undefined";
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
  if (isExecutionProvider(cached)) {
    return cached;
  }

  return null;
}

function isExecutionProvider(value: string | null): value is ExecutionProvider {
  return value !== null && getKnownExecutionProviders().includes(value as ExecutionProvider);
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

function createProbeCanvas():
  | HTMLCanvasElement
  | OffscreenCanvas
  | null {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(1, 1);
  }

  if (typeof document !== "undefined") {
    return document.createElement("canvas");
  }

  return null;
}
