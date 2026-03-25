import type { PaddleOcrModelManifest } from "../types";

export interface OfficialManifestOptions {
  baseUrl: string;
  dictionaryUrl?: string;
  detectionModelPath?: string;
  recognitionModelPath?: string;
}

export const officialPaddleOcrSources = {
  docs: {
    releaseNotes: "https://github.com/PaddlePaddle/PaddleOCR",
    onnx: "https://www.paddleocr.ai/main/en/version2.x/legacy/paddle2onnx.html",
    webRuntime: "https://onnxruntime.ai/docs/get-started/with-javascript/web.html"
  },
  paddleInferenceModels: {
    detection:
      "https://paddleocr.bj.bcebos.com/PP-OCRv5/chinese/ch_PP-OCRv5_det_infer.tar",
    recognition:
      "https://paddleocr.bj.bcebos.com/PP-OCRv5/chinese/ch_PP-OCRv5_rec_infer.tar",
    dictionary:
      "https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/ppocr_keys_v1.txt"
  }
} as const;

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
      url: options.dictionaryUrl ?? officialPaddleOcrSources.paddleInferenceModels.dictionary
    },
    detectionLimitSideLen: 736,
    detectionThreshold: 0.3,
    detectionBoxThreshold: 0.6,
    detectionUnclipRatio: 1.8,
    detectionMinSize: 3,
    recognitionImageShape: [3, 48, 320]
  };
}
