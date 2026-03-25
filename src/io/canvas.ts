import type { OcrImageSource } from "../types";
import { clamp } from "../utils/math";

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type AnyRenderingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function hasOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}

function isImageData(value: unknown): value is ImageData {
  return typeof ImageData !== "undefined" && value instanceof ImageData;
}

function isImageBitmap(value: unknown): value is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap;
}

function isHtmlImageElement(value: unknown): value is HTMLImageElement {
  return typeof HTMLImageElement !== "undefined" && value instanceof HTMLImageElement;
}

function isHtmlCanvasElement(value: unknown): value is HTMLCanvasElement {
  return typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement;
}

function isOffscreenCanvas(value: unknown): value is OffscreenCanvas {
  return hasOffscreenCanvas() && value instanceof OffscreenCanvas;
}

function createCanvas(width: number, height: number): AnyCanvas {
  if (hasOffscreenCanvas()) {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  throw new Error("A canvas implementation is required in this runtime.");
}

function getContext(canvas: AnyCanvas): AnyRenderingContext {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to create a 2D canvas context.");
  }

  return context;
}

async function loadImageFromUrl(url: string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap !== "undefined") {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`);
    }
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  if (typeof Image === "undefined") {
    throw new Error("This runtime cannot load URL inputs.");
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    image.src = url;
  });
}

async function blobToImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap !== "undefined") {
    return createImageBitmap(blob);
  }

  const url = URL.createObjectURL(blob);
  try {
    return await loadImageFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawIntoImageData(source: ImageBitmap | HTMLImageElement): ImageData {
  const width = isHtmlImageElement(source) ? source.naturalWidth || source.width : source.width;
  const height = isHtmlImageElement(source) ? source.naturalHeight || source.height : source.height;
  const canvas = createCanvas(width, height);
  const context = getContext(canvas);
  context.drawImage(source, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

export async function ensureImageData(source: OcrImageSource): Promise<ImageData> {
  if (isImageData(source)) {
    return source;
  }

  if (isHtmlCanvasElement(source) || isOffscreenCanvas(source)) {
    const context = getContext(source);
    return context.getImageData(0, 0, source.width, source.height);
  }

  if (isImageBitmap(source) || isHtmlImageElement(source)) {
    return drawIntoImageData(source);
  }

  if (typeof source === "string") {
    return drawIntoImageData(await loadImageFromUrl(source));
  }

  if (source instanceof Blob) {
    return drawIntoImageData(await blobToImage(source));
  }

  throw new Error("Unsupported image source.");
}

export function resizeImageData(source: ImageData, width: number, height: number): ImageData {
  const inputCanvas = createCanvas(source.width, source.height);
  const inputContext = getContext(inputCanvas);
  inputContext.putImageData(source, 0, 0);

  const outputCanvas = createCanvas(width, height);
  const outputContext = getContext(outputCanvas);
  outputContext.drawImage(inputCanvas, 0, 0, width, height);

  return outputContext.getImageData(0, 0, width, height);
}

export function cropImageData(
  source: ImageData,
  left: number,
  top: number,
  width: number,
  height: number
): ImageData {
  const x = clamp(Math.floor(left), 0, source.width - 1);
  const y = clamp(Math.floor(top), 0, source.height - 1);
  const w = clamp(Math.ceil(width), 1, source.width - x);
  const h = clamp(Math.ceil(height), 1, source.height - y);

  const pixels = new Uint8ClampedArray(w * h * 4);

  for (let row = 0; row < h; row += 1) {
    const sourceOffset = ((y + row) * source.width + x) * 4;
    const targetOffset = row * w * 4;
    pixels.set(source.data.subarray(sourceOffset, sourceOffset + w * 4), targetOffset);
  }

  return new ImageData(pixels, w, h);
}
