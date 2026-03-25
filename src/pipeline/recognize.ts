import type { OcrLine } from "../types";
import { maxIndex, maxProbability } from "../utils/math";

interface DecodeOptions {
  blankIndex?: number;
}

export function decodeRecognitionOutput(
  output: Float32Array,
  dims: readonly number[],
  dictionary: readonly string[],
  options: DecodeOptions = {}
): Array<Pick<OcrLine, "text" | "score">> {
  if (dims.length !== 3) {
    throw new Error(`Unsupported recognition output shape: ${dims.join("x")}`);
  }

  const [batch, second, third] = dims;
  const blankIndex = options.blankIndex ?? 0;
  const isBatchTimeClass = second < third;
  const timeSteps = isBatchTimeClass ? second : third;
  const classes = isBatchTimeClass ? third : second;
  const results: Array<Pick<OcrLine, "text" | "score">> = [];

  for (let batchIndex = 0; batchIndex < batch; batchIndex += 1) {
    let lastIndex = -1;
    const pieces: string[] = [];
    const confidences: number[] = [];

    for (let step = 0; step < timeSteps; step += 1) {
      const logits = new Float32Array(classes);

      for (let classIndex = 0; classIndex < classes; classIndex += 1) {
        const offset = isBatchTimeClass
          ? (batchIndex * timeSteps + step) * classes + classIndex
          : (batchIndex * classes + classIndex) * timeSteps + step;
        logits[classIndex] = output[offset];
      }

      const prediction = maxIndex(logits);
      if (prediction.index === blankIndex || prediction.index === lastIndex) {
        lastIndex = prediction.index;
        continue;
      }

      const token = dictionary[prediction.index - 1];
      if (token) {
        pieces.push(token);
        confidences.push(maxProbability(logits));
      }

      lastIndex = prediction.index;
    }

    const score =
      confidences.length === 0
        ? 0
        : confidences.reduce((total, value) => total + value, 0) / confidences.length;

    results.push({
      text: pieces.join(""),
      score
    });
  }

  return results;
}
