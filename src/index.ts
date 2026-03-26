export { createPaddleOcr, PaddleOcrWeb } from "./paddle-ocr";
export {
  createPPOcrV5BrowserManifest,
  DEFAULT_DICTIONARY_URL,
  PPOCRV5_MODEL_PATHS
} from "./manifests/official";
export {
  createDefaultPPOcrV5,
  createPPOcrV5,
  DEFAULT_MODEL_BASE_URL,
  DEFAULT_MODEL_RELEASE_TAG,
  DEFAULT_ORT_WASM_PATHS,
  ocrWithDefaultPPOcrV5,
  ocrWithPPOcrV5
} from "./presets/ppocrv5";
export {
  getAvailableExecutionProviders,
  getExecutionProviderSupport,
  getKnownExecutionProviders,
  isExecutionProviderAvailable,
  supportsWebGl,
  supportsWebGpu,
  supportsWebNN,
  supportsWasm
} from "./runtime/provider";
export type {
  CreatePaddleOcrOptions,
  CreatePPOcrV5Options,
  ExecutionProvider,
  ExecutionProviderSupport,
  ModelAsset,
  OcrBox,
  OcrImageSource,
  OcrLine,
  OcrOptions,
  OcrProgress,
  OcrProgressCallback,
  OcrProgressPhase,
  OcrResult,
  PaddleOcrModelManifest,
  PPOcrV5ModelVariant,
  ProviderPreference,
  RuntimeSelection
} from "./types";
