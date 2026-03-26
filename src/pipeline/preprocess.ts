import { resizeImageData } from "../io/canvas";
import { roundUpToMultiple } from "../utils/math";

// PaddleOCR normalizes in BGR channel order with ImageNet values
const DET_MEAN_BGR = [0.485, 0.456, 0.406] as const;
const DET_STD_BGR = [0.229, 0.224, 0.225] as const;

export interface DetectionPreprocessResult {
  data: Float32Array;
  dims: [1, 3, number, number];
  resizedWidth: number;
  resizedHeight: number;
}

export interface RecognitionPreprocessResult {
  data: Float32Array;
  dims: [1, number, number, number];
}

export function preprocessDetection(
  source: ImageData,
  limitSideLen: number
): DetectionPreprocessResult {
  const maxSide = Math.max(source.width, source.height);
  const scale = maxSide > limitSideLen ? limitSideLen / maxSide : 1;
  const resizedWidth = roundUpToMultiple(Math.max(32, Math.round(source.width * scale)), 32);
  const resizedHeight = roundUpToMultiple(Math.max(32, Math.round(source.height * scale)), 32);
  const resized = resizeImageData(source, resizedWidth, resizedHeight);
  const tensor = new Float32Array(3 * resizedWidth * resizedHeight);

  for (let y = 0; y < resizedHeight; y += 1) {
    for (let x = 0; x < resizedWidth; x += 1) {
      const pixelOffset = (y * resizedWidth + x) * 4;
      const red = resized.data[pixelOffset] / 255;
      const green = resized.data[pixelOffset + 1] / 255;
      const blue = resized.data[pixelOffset + 2] / 255;
      const spatialOffset = y * resizedWidth + x;
      tensor[spatialOffset] = (blue - DET_MEAN_BGR[0]) / DET_STD_BGR[0];
      tensor[resizedWidth * resizedHeight + spatialOffset] =
        (green - DET_MEAN_BGR[1]) / DET_STD_BGR[1];
      tensor[2 * resizedWidth * resizedHeight + spatialOffset] =
        (red - DET_MEAN_BGR[2]) / DET_STD_BGR[2];
    }
  }

  return {
    data: tensor,
    dims: [1, 3, resizedHeight, resizedWidth],
    resizedWidth,
    resizedHeight
  };
}

export function preprocessRecognition(
  source: ImageData,
  imageShape: readonly [number, number, number]
): RecognitionPreprocessResult {
  const [, targetHeight, targetWidth] = imageShape;
  const ratio = source.width / Math.max(source.height, 1);
  const resizedWidth = Math.min(targetWidth, Math.max(1, Math.round(targetHeight * ratio)));
  const resized = resizeImageData(source, resizedWidth, targetHeight);
  const tensor = new Float32Array(3 * targetHeight * targetWidth);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const spatialOffset = y * targetWidth + x;
      const channelOffset = spatialOffset;

      if (x < resizedWidth) {
        const pixelOffset = (y * resizedWidth + x) * 4;
        tensor[channelOffset] = resized.data[pixelOffset + 2] / 127.5 - 1;
        tensor[targetHeight * targetWidth + spatialOffset] =
          resized.data[pixelOffset + 1] / 127.5 - 1;
        tensor[2 * targetHeight * targetWidth + spatialOffset] =
          resized.data[pixelOffset] / 127.5 - 1;
      } else {
        tensor[channelOffset] = 0;
        tensor[targetHeight * targetWidth + spatialOffset] = 0;
        tensor[2 * targetHeight * targetWidth + spatialOffset] = 0;
      }
    }
  }

  return {
    data: tensor,
    dims: [1, 3, targetHeight, targetWidth]
  };
}
