# `ffocr`

Browser OCR for frontend apps using PaddleOCR models converted to ONNX.

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

## Required model files

Your `baseUrl` must point to a folder containing:

- `det.onnx`
- `rec.onnx`
- `ppocr_keys_v1.txt`

## Main API

### `createPPOcrV5({ baseUrl, ...options })`

Recommended entry point for most apps.

### `ocrWithPPOcrV5(source, options)`

Convenient one-shot OCR call.

### `createPaddleOcr({ manifest, ...options })`

Lower-level API for custom manifests or model paths.

## Supported inputs

- `ImageData`
- `ImageBitmap`
- `HTMLImageElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `Blob`
- `string` URL

## Runtime

- Uses `webgpu` when available
- Falls back to `wasm`
- Can cache the faster provider per browser

## Extra docs

- Model conversion: [`docs/MODEL_CONVERSION.md`](./docs/MODEL_CONVERSION.md)
- Example app: [`examples/vite-demo`](./examples/vite-demo/README.md)
