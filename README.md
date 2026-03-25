# `ffocr`

Browser-first OCR built on PaddleOCR models converted to ONNX and executed with `onnxruntime-web`.

## Install

```bash
npm install ffocr
```

## Quick start

```ts
import { createPPOcrV5 } from "ffocr";

const ocr = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});

const result = await ocr.ocr(fileOrBlobOrUrl);
console.log(result.text);
```

## What you need to host

`ffocr` does not bundle model weights. Your `baseUrl` should point to a folder containing:

- `det.onnx`
- `rec.onnx`
- `ppocr_keys_v1.txt`

Example:

```text
https://your-cdn.example.com/models/pp-ocrv5
```

## Main API

### `createPPOcrV5({ baseUrl, ...options })`

The simplest way to use the package. It preconfigures a PP-OCRv5 browser runtime with sensible defaults.

```ts
import { createPPOcrV5 } from "ffocr";

const ocr = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5",
  warmup: true
});

const result = await ocr.ocr(file);
```

### `ocrWithPPOcrV5(source, options)`

Useful for one-shot OCR calls when you do not want to manage an instance.

```ts
import { ocrWithPPOcrV5 } from "ffocr";

const result = await ocrWithPPOcrV5(file, {
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});
```

### `createPaddleOcr({ manifest, ...options })`

Use this lower-level API if you want to supply your own manifest and model paths.

## Supported inputs

`ocr.ocr(source)` accepts:

- `ImageData`
- `ImageBitmap`
- `HTMLImageElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `Blob`
- `string` URL

## Runtime behavior

- Prefers `webgpu` when available
- Falls back to `wasm`
- Can benchmark and cache the faster provider per browser

This is a good default for Apple Silicon devices such as Mac M3 machines in Chromium-based browsers.

## Example app

A runnable browser example is available in [`examples/vite-demo`](./examples/vite-demo/README.md).

## Model preparation

If you need help converting official PaddleOCR PP-OCRv5 models into ONNX files, see:

- [`docs/MODEL_CONVERSION.md`](./docs/MODEL_CONVERSION.md)

## Notes

- This package is browser-focused
- Detection postprocess is a browser-friendly approximation, not the full Python PaddleOCR polygon pipeline
- Heavily rotated or curved text may need a more exact postprocess later

## Maintainers

Release and deployment notes are in [`docs/RELEASE.md`](./docs/RELEASE.md).
