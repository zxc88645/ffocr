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
export const DEFAULT_MODEL_RELEASE_TAG = "models-ppocrv5-v3";
export const DEFAULT_MODEL_BASE_URL =
  `https://github.com/zxc88645/ffocr/releases/download/${DEFAULT_MODEL_RELEASE_TAG}`;

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
    modelVariant,
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
      modelVariant,
      detectionModelPath,
      recognitionModelPath
    }),
    ort: createRecommendedOrtOptions(ort)
  });
}

export function createDefaultPPOcrV5(
  options: Omit<CreatePPOcrV5Options, "baseUrl"> = {}
): PaddleOcrWeb {
  return createPPOcrV5({
    ...options,
    baseUrl: DEFAULT_MODEL_BASE_URL
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

export async function ocrWithDefaultPPOcrV5(
  source: OcrImageSource,
  options: Omit<CreatePPOcrV5Options, "baseUrl"> = {},
  ocrOptions?: OcrOptions
): Promise<OcrResult> {
  return ocrWithPPOcrV5(
    source,
    {
      ...options,
      baseUrl: DEFAULT_MODEL_BASE_URL
    },
    ocrOptions
  );
}
