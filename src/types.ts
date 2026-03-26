export type ExecutionProvider = "webgpu" | "webnn" | "webgl" | "wasm";

export type ProviderPreference =
  | "auto"
  | ExecutionProvider
  | readonly ExecutionProvider[];

export type DictionarySource = readonly string[] | { url: string };

export interface ModelAsset {
  url: string;
  inputName?: string;
  outputName?: string;
}

export interface PaddleOcrModelManifest {
  id: string;
  detection: ModelAsset;
  recognition: ModelAsset;
  dictionary: DictionarySource;
  detectionLimitSideLen?: number;
  detectionThreshold?: number;
  detectionBoxThreshold?: number;
  detectionUnclipRatio?: number;
  detectionMinSize?: number;
  recognitionImageShape?: readonly [channels: number, height: number, width: number];
}

export interface OrtRuntimeOptions {
  wasmPaths?: string | Record<string, string>;
  wasmThreads?: number;
}

export interface ExecutionProviderSupport {
  provider: ExecutionProvider;
  available: boolean;
}

export interface CreatePaddleOcrOptions {
  manifest: PaddleOcrModelManifest;
  providerPreference?: ProviderPreference;
  autoBenchmark?: boolean;
  benchmarkCache?: boolean;
  warmup?: boolean;
  ort?: OrtRuntimeOptions;
}

export type PPOcrV5ModelVariant = "server" | "mobile";

export interface CreatePPOcrV5Options extends Omit<CreatePaddleOcrOptions, "manifest"> {
  baseUrl: string;
  dictionaryUrl?: string;
  modelVariant?: PPOcrV5ModelVariant;
  detectionModelPath?: string;
  recognitionModelPath?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface OcrBox {
  points: readonly [Point, Point, Point, Point];
  score: number;
}

export interface OcrLine {
  text: string;
  score: number;
  box: OcrBox;
}

export interface RuntimeBenchmark {
  provider: ExecutionProvider;
  latencyMs: number;
}

export interface RuntimeSelection {
  provider: ExecutionProvider;
  candidates: readonly ExecutionProvider[];
  benchmarked: boolean;
  benchmarks: readonly RuntimeBenchmark[];
}

export interface OcrImageMeta {
  width: number;
  height: number;
}

export interface OcrResult {
  text: string;
  lines: readonly OcrLine[];
  image: OcrImageMeta;
  runtime: RuntimeSelection;
}

export interface OcrOptions {
  maxRecognitionBatchSize?: number;
}

export type OcrImageSource =
  | ImageData
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | Blob
  | string;
