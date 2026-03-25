import type {
  CreatePaddleOcrOptions,
  DictionarySource,
  ExecutionProvider,
  OcrBox,
  OcrImageSource,
  OcrLine,
  OcrOptions,
  OcrResult,
  RuntimeBenchmark,
  RuntimeSelection
} from "./types";
import { cropImageData, ensureImageData } from "./io/canvas";
import { createSession, configureOrt, runSession, type OrtSession } from "./runtime/ort";
import {
  buildProviderCacheKey,
  getProviderCandidates,
  readCachedProvider,
  writeCachedProvider
} from "./runtime/provider";
import { postprocessDetection } from "./pipeline/detect";
import { preprocessDetection, preprocessRecognition } from "./pipeline/preprocess";
import { decodeRecognitionOutput } from "./pipeline/recognize";
import { axisAlignedBounds, sortBoxes } from "./utils/math";

const DEFAULT_RECOGNITION_SHAPE = [3, 48, 320] as const;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function isDictionaryUrlSource(source: DictionarySource): source is { url: string } {
  return !Array.isArray(source);
}

async function loadDictionary(source: DictionarySource): Promise<string[]> {
  if (!isDictionaryUrlSource(source)) {
    return [...source];
  }

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Unable to fetch dictionary from ${source.url}`);
  }

  const text = await response.text();
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function createBlankTensor(width: number, height: number): Float32Array {
  return new Float32Array(3 * width * height);
}

function combineRecognitionBatch(
  batch: readonly Float32Array[],
  shape: readonly [number, number, number]
): Float32Array {
  const [channels, height, width] = shape;
  const itemSize = channels * height * width;
  const merged = new Float32Array(batch.length * itemSize);

  batch.forEach((tensor, index) => {
    merged.set(tensor, index * itemSize);
  });

  return merged;
}

export class PaddleOcrWeb {
  private readonly options: CreatePaddleOcrOptions;

  private detectorSession: OrtSession | null = null;

  private recognizerSession: OrtSession | null = null;

  private dictionary: string[] = [];

  private runtimeSelection: RuntimeSelection | null = null;

  private initPromise: Promise<void> | null = null;

  constructor(options: CreatePaddleOcrOptions) {
    this.options = options;
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInit();
    }

    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    configureOrt(this.options.ort);
    this.dictionary = await loadDictionary(this.options.manifest.dictionary);
    const provider = await this.selectProvider();
    this.detectorSession = await createSession(this.options.manifest.detection.url, provider);
    this.recognizerSession = await createSession(this.options.manifest.recognition.url, provider);

    if (this.options.warmup) {
      await this.warmupSessions();
    }
  }

  private async selectProvider(): Promise<ExecutionProvider> {
    const candidates = getProviderCandidates(this.options.providerPreference);
    const firstCandidate = candidates[0];
    if (!firstCandidate) {
      throw new Error("No ONNX Runtime execution providers are available.");
    }

    const cacheKey = buildProviderCacheKey(this.options.manifest);

    if (this.options.benchmarkCache !== false) {
      const cached = readCachedProvider(cacheKey);
      if (cached && candidates.includes(cached)) {
        this.runtimeSelection = {
          provider: cached,
          candidates,
          benchmarked: true,
          benchmarks: []
        };
        return cached;
      }
    }

    if (candidates.length === 1 || this.options.autoBenchmark === false) {
      const provider = firstCandidate;
      this.runtimeSelection = {
        provider,
        candidates,
        benchmarked: false,
        benchmarks: []
      };
      return provider;
    }

    const benchmarks: RuntimeBenchmark[] = [];
    let bestProvider = firstCandidate;
    let bestLatency = Number.POSITIVE_INFINITY;

    for (const provider of candidates) {
      try {
        const session = await createSession(this.options.manifest.detection.url, provider);
        const tensor = createBlankTensor(640, 640);
        await runSession(session, tensor, [1, 3, 640, 640], this.options.manifest.detection.inputName);
        const start = now();
        await runSession(session, tensor, [1, 3, 640, 640], this.options.manifest.detection.inputName);
        const latencyMs = now() - start;
        benchmarks.push({ provider, latencyMs });

        if (latencyMs < bestLatency) {
          bestLatency = latencyMs;
          bestProvider = provider;
        }
      } catch {
        continue;
      }
    }

    this.runtimeSelection = {
      provider: bestProvider,
      candidates,
      benchmarked: benchmarks.length > 0,
      benchmarks
    };

    if (this.options.benchmarkCache !== false && benchmarks.length > 0) {
      writeCachedProvider(cacheKey, bestProvider, benchmarks);
    }

    return bestProvider;
  }

  async warmup(): Promise<void> {
    await this.init();
    await this.warmupSessions();
  }

  private async warmupSessions(): Promise<void> {
    if (!this.detectorSession || !this.recognizerSession) {
      return;
    }

    await runSession(
      this.detectorSession,
      createBlankTensor(640, 640),
      [1, 3, 640, 640],
      this.options.manifest.detection.inputName,
      this.options.manifest.detection.outputName
    );

    const recognitionShape =
      this.options.manifest.recognitionImageShape ?? DEFAULT_RECOGNITION_SHAPE;
    const [channels, height, width] = recognitionShape;
    await runSession(
      this.recognizerSession,
      new Float32Array(channels * height * width),
      [1, channels, height, width],
      this.options.manifest.recognition.inputName,
      this.options.manifest.recognition.outputName
    );
  }

  getRuntimeSelection(): RuntimeSelection | null {
    return this.runtimeSelection;
  }

  async ocr(source: OcrImageSource, options: OcrOptions = {}): Promise<OcrResult> {
    await this.init();

    if (!this.detectorSession || !this.recognizerSession || !this.runtimeSelection) {
      throw new Error("The OCR runtime was not initialized.");
    }

    const image = await ensureImageData(source);
    const detectionInput = preprocessDetection(
      image,
      this.options.manifest.detectionLimitSideLen ?? 736
    );
    const detectionOutput = await runSession(
      this.detectorSession,
      detectionInput.data,
      detectionInput.dims,
      this.options.manifest.detection.inputName,
      this.options.manifest.detection.outputName
    );

    const rawDetection = detectionOutput.data as Float32Array;
    const boxes = sortBoxes(
      postprocessDetection(rawDetection, detectionOutput.dims, {
        sourceWidth: image.width,
        sourceHeight: image.height,
        resizedWidth: detectionInput.resizedWidth,
        resizedHeight: detectionInput.resizedHeight,
        threshold: this.options.manifest.detectionThreshold ?? 0.3,
        boxThreshold: this.options.manifest.detectionBoxThreshold ?? 0.6,
        unclipRatio: this.options.manifest.detectionUnclipRatio ?? 1.8,
        minSize: this.options.manifest.detectionMinSize ?? 3
      })
    );
    const lines = await this.recognizeBoxes(image, boxes, options.maxRecognitionBatchSize ?? 8);

    return {
      text: lines.map((line) => line.text).join("\n"),
      lines,
      image: {
        width: image.width,
        height: image.height
      },
      runtime: this.runtimeSelection
    };
  }

  private async recognizeBoxes(
    image: ImageData,
    boxes: readonly OcrBox[],
    batchSize: number
  ): Promise<OcrLine[]> {
    if (!this.recognizerSession) {
      throw new Error("Recognizer session is not available.");
    }

    const recognitionShape =
      this.options.manifest.recognitionImageShape ?? DEFAULT_RECOGNITION_SHAPE;
    const lines: OcrLine[] = [];

    for (let cursor = 0; cursor < boxes.length; cursor += batchSize) {
      const batchBoxes = boxes.slice(cursor, cursor + batchSize);
      const tensors: Float32Array[] = [];

      for (const box of batchBoxes) {
        const bounds = axisAlignedBounds(box);
        const crop = cropImageData(image, bounds.left, bounds.top, bounds.width, bounds.height);
        tensors.push(preprocessRecognition(crop, recognitionShape).data);
      }

      const merged = combineRecognitionBatch(tensors, recognitionShape);
      const [channels, height, width] = recognitionShape;
      const recognitionOutput = await runSession(
        this.recognizerSession,
        merged,
        [batchBoxes.length, channels, height, width],
        this.options.manifest.recognition.inputName,
        this.options.manifest.recognition.outputName
      );
      const decoded = decodeRecognitionOutput(
        recognitionOutput.data as Float32Array,
        recognitionOutput.dims,
        this.dictionary
      );

      decoded.forEach((item, index) => {
        const box = batchBoxes[index];
        lines.push({
          text: item.text,
          score: (item.score + box.score) / 2,
          box
        });
      });
    }

    return lines.filter((line) => line.text.length > 0);
  }

  dispose(): void {
    this.detectorSession = null;
    this.recognizerSession = null;
  }
}

export function createPaddleOcr(options: CreatePaddleOcrOptions): PaddleOcrWeb {
  return new PaddleOcrWeb(options);
}
