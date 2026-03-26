import type { PaddleOcrModelManifest, PPOcrV5ModelVariant } from "../types";

export interface OfficialManifestOptions {
  baseUrl: string;
  dictionaryUrl?: string;
  modelVariant?: PPOcrV5ModelVariant;
  detectionModelPath?: string;
  recognitionModelPath?: string;
}

export const DEFAULT_DICTIONARY_URL =
  "https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/dict/ppocrv5_dict.txt";

export const PPOCRV5_MODEL_PATHS = {
  detection: {
    server: "det_server.onnx",
    mobile: "det_mobile.onnx"
  },
  recognition: {
    server: "rec_server.onnx",
    mobile: "rec_mobile.onnx"
  }
} as const;

function resolveDetectionPath(options: OfficialManifestOptions): string {
  if (options.detectionModelPath) {
    return options.detectionModelPath;
  }
  return PPOCRV5_MODEL_PATHS.detection[options.modelVariant ?? "server"];
}

function resolveRecognitionPath(options: OfficialManifestOptions): string {
  if (options.recognitionModelPath) {
    return options.recognitionModelPath;
  }
  return PPOCRV5_MODEL_PATHS.recognition[options.modelVariant ?? "server"];
}

export function createPPOcrV5BrowserManifest(
  options: OfficialManifestOptions
): PaddleOcrModelManifest {
  const normalizedBase = options.baseUrl.replace(/\/$/, "");
  const variant = options.modelVariant ?? "server";

  return {
    id: variant === "server" ? "pp-ocrv5-browser" : `pp-ocrv5-${variant}-browser`,
    detection: {
      url: `${normalizedBase}/${resolveDetectionPath(options)}`
    },
    recognition: {
      url: `${normalizedBase}/${resolveRecognitionPath(options)}`
    },
    dictionary: {
      url: options.dictionaryUrl ?? DEFAULT_DICTIONARY_URL
    },
    detectionLimitSideLen: 960,
    detectionThreshold: 0.3,
    detectionBoxThreshold: 0.6,
    detectionUnclipRatio: 1.5,
    detectionMinSize: 3,
    recognitionImageShape: [3, 48, 320]
  };
}
