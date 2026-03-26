import * as ort from "onnxruntime-web";
import type { ExecutionProvider, OrtRuntimeOptions } from "../types";

export type OrtSession = ort.InferenceSession;

export type DownloadProgressCallback = (loaded: number, total: number | undefined) => void;

let configured = false;

export function configureOrt(options?: OrtRuntimeOptions): void {
  if (configured || !options) {
    return;
  }

  if (options.wasmPaths) {
    ort.env.wasm.wasmPaths = options.wasmPaths;
  }

  if (options.wasmThreads) {
    ort.env.wasm.numThreads = options.wasmThreads;
  }

  configured = true;
}

const MODEL_CACHE_NAME = "ffocr-models";

async function readResponseWithProgress(
  response: Response,
  onProgress?: DownloadProgressCallback
): Promise<ArrayBuffer> {
  if (!onProgress || !response.body) {
    return response.arrayBuffer();
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total);
  }

  const result = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

async function fetchWithProgress(
  url: string,
  onProgress?: DownloadProgressCallback,
  useCache?: boolean
): Promise<ArrayBuffer> {
  if (useCache && typeof caches !== "undefined") {
    const cache = await caches.open(MODEL_CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      return readResponseWithProgress(cached, onProgress);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const cloned = response.clone();
    cache.put(url, cloned);
    return readResponseWithProgress(response, onProgress);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return readResponseWithProgress(response, onProgress);
}

export async function createSession(
  url: string,
  provider: ExecutionProvider,
  onDownloadProgress?: DownloadProgressCallback,
  useCache?: boolean
): Promise<OrtSession> {
  const data = await fetchWithProgress(url, onDownloadProgress, useCache);
  return ort.InferenceSession.create(data, {
    executionProviders: [provider],
    graphOptimizationLevel: "all"
  });
}

export async function runSession(
  session: OrtSession,
  data: Float32Array,
  dims: readonly number[],
  inputName?: string,
  outputName?: string
): Promise<ort.Tensor> {
  const feeds: Record<string, ort.Tensor> = {
    [inputName ?? session.inputNames[0]]: new ort.Tensor("float32", data, dims)
  };

  const outputs = await session.run(feeds);
  const output = outputs[outputName ?? session.outputNames[0]];
  if (!output) {
    throw new Error("ONNX Runtime returned no matching output tensor.");
  }

  return output;
}
