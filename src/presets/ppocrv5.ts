import { createPPOcrV5BrowserManifest } from "../manifests/official";
import { createPaddleOcr, type PaddleOcrWeb } from "../paddle-ocr";
import type {
  CreatePPOcrV5Options,
  OcrImageSource,
  OcrOptions,
  OcrResult,
  OrtRuntimeOptions
} from "../types";

export const DEFAULT_ORT_WASM_PATHS = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

function createRecommendedOrtOptions(options?: OrtRuntimeOptions): OrtRuntimeOptions {
  return {
    wasmPaths: options?.wasmPaths ?? DEFAULT_ORT_WASM_PATHS,
    wasmThreads: options?.wasmThreads
  };
}

export function createPPOcrV5(options: CreatePPOcrV5Options): PaddleOcrWeb {
  const {
    baseUrl,
    dictionaryUrl,
    detectionModelPath,
    recognitionModelPath,
    ort,
    ...rest
  } = options;

  return createPaddleOcr({
    ...rest,
    manifest: createPPOcrV5BrowserManifest({
      baseUrl,
      dictionaryUrl,
      detectionModelPath,
      recognitionModelPath
    }),
    ort: createRecommendedOrtOptions(ort)
  });
}

export async function ocrWithPPOcrV5(
  source: OcrImageSource,
  options: CreatePPOcrV5Options,
  ocrOptions?: OcrOptions
): Promise<OcrResult> {
  const runtime = createPPOcrV5(options);

  try {
    return await runtime.ocr(source, ocrOptions);
  } finally {
    runtime.dispose();
  }
}
