export { createPaddleOcr, PaddleOcrWeb } from "./paddle-ocr";
export { createPPOcrV5BrowserManifest, officialPaddleOcrSources } from "./manifests/official";
export {
  createDefaultPPOcrV5,
  createPPOcrV5,
  DEFAULT_MODEL_BASE_URL,
  DEFAULT_MODEL_RELEASE_TAG,
  DEFAULT_ORT_WASM_PATHS,
  ocrWithDefaultPPOcrV5,
  ocrWithPPOcrV5
} from "./presets/ppocrv5";
export type {
  CreatePaddleOcrOptions,
  CreatePPOcrV5Options,
  ExecutionProvider,
  ModelAsset,
  OcrBox,
  OcrImageSource,
  OcrLine,
  OcrOptions,
  OcrResult,
  PaddleOcrModelManifest,
  ProviderPreference,
  RuntimeSelection
} from "./types";
