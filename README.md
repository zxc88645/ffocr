# `ffocr`

Browser OCR for frontend apps using PaddleOCR models converted to ONNX.

**Live Demo**: https://zxc88645.github.io/ffocr/demo/

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

## Progress callback

Track loading, download, and inference progress via `onProgress`:

```ts
const result = await ocr.ocr(file, {
  onProgress({ phase, current, total, loaded, totalBytes }) {
    // phase: "loading_dictionary" | "loading_detection_model"
    //      | "loading_recognition_model" | "warmup"
    //      | "preprocessing" | "detecting" | "recognizing"
    if (loaded != null && totalBytes != null) {
      const pct = Math.round((loaded / totalBytes) * 100);
      console.log(`${phase}: ${pct}%`);
    } else if (phase === "recognizing") {
      console.log(`Recognizing ${current}/${total}`);
    } else {
      console.log(phase);
    }
  }
});
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

- `det_server.onnx`
- `det_mobile.onnx`
- `rec_server.onnx`
- `rec_mobile.onnx`
- `ppocrv5_dict.txt`

The default hosted model URL only works after those files have been uploaded to the GitHub Release described in [`docs/MODEL_RELEASES.md`](./docs/MODEL_RELEASES.md).

The bundled conversion flow patches the generated ONNX files so the default PP-OCRv5 models stay compatible with ONNX Runtime WebGPU.

## Supported inputs

- `ImageData`
- `ImageBitmap`
- `HTMLImageElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `Blob`
- `string` URL

## Runtime

- Detects available ONNX Runtime Web execution providers including `webgpu`, `webnn`, `webgl`, and `wasm`
- In `auto` mode, picks the first available provider in this order: `webgpu` -> `webnn` -> `webgl` -> `wasm`

## Extra docs

- Model conversion: [`docs/MODEL_CONVERSION.md`](./docs/MODEL_CONVERSION.md)
- Model release hosting: [`docs/MODEL_RELEASES.md`](./docs/MODEL_RELEASES.md)
- Example app: [`examples/vite-demo`](./examples/vite-demo/README.md)
