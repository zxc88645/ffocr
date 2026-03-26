import type { PaddleOcrModelManifest } from "../types";

export interface OfficialManifestOptions {
  baseUrl: string;
  dictionaryUrl?: string;
  detectionModelPath?: string;
  recognitionModelPath?: string;
}

export const DEFAULT_DICTIONARY_URL =
  "https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/ppocr_keys_v1.txt";

export function createPPOcrV5BrowserManifest(
  options: OfficialManifestOptions
): PaddleOcrModelManifest {
  const normalizedBase = options.baseUrl.replace(/\/$/, "");

  return {
    id: "pp-ocrv5-browser",
    detection: {
      url: `${normalizedBase}/${options.detectionModelPath ?? "det.onnx"}`
    },
    recognition: {
      url: `${normalizedBase}/${options.recognitionModelPath ?? "rec.onnx"}`
    },
    dictionary: {
      url: options.dictionaryUrl ?? DEFAULT_DICTIONARY_URL
    },
    detectionLimitSideLen: 736,
    detectionThreshold: 0.3,
    detectionBoxThreshold: 0.6,
    detectionUnclipRatio: 1.8,
    detectionMinSize: 3,
    recognitionImageShape: [3, 48, 320]
  };
}
