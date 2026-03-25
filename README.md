# `ffocr`

Browser OCR for frontend apps using PaddleOCR models converted to ONNX.

## Install

```bash
npm install ffocr
```

## Quick start

If you want the built-in hosted model:

```ts
import { createDefaultPPOcrV5 } from "ffocr";

const ocr = createDefaultPPOcrV5();
const result = await ocr.ocr(fileOrBlobOrUrl);
console.log(result.text);
```

If you want to host the model files yourself:

```ts
import { createPPOcrV5 } from "ffocr";

const ocr = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});

const result = await ocr.ocr(fileOrBlobOrUrl);
console.log(result.text);
```

## Main API

### `createDefaultPPOcrV5(options?)`

Creates an OCR instance using the package default hosted model URL.

### `ocrWithDefaultPPOcrV5(source, options?, ocrOptions?)`

One-shot OCR helper using the package default hosted model URL.

### `createPPOcrV5({ baseUrl, ...options })`

Recommended when you want full control over model hosting.

### `ocrWithPPOcrV5(source, options, ocrOptions?)`

One-shot OCR helper for a custom `baseUrl`.

### `createPaddleOcr({ manifest, ...options })`

Lower-level API for custom manifests or model paths.

## Required model files

A model base URL must point to a folder containing:

- `det.onnx`
- `rec.onnx`
- `ppocr_keys_v1.txt`

The default hosted model URL only works after those files have been uploaded to the GitHub Release described in [`docs/MODEL_RELEASES.md`](./docs/MODEL_RELEASES.md).

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
- Model release hosting: [`docs/MODEL_RELEASES.md`](./docs/MODEL_RELEASES.md)
- Example app: [`examples/vite-demo`](./examples/vite-demo/README.md)
