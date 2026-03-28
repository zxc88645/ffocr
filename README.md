# `ffocr`

Browser OCR for frontend apps using PaddleOCR models converted to ONNX.

**npm**: <https://www.npmjs.com/package/ffocr>

**Live Demo**: <https://zxc88645.github.io/ffocr/demo/>

## Install

```bash
npm install ffocr
```

The examples below use ESM `import` (Vite, webpack, modern Node, and so on). The package also publishes **ESM** (`.mjs`) and **CommonJS** (`.cjs`) via `package.json` `exports`; if you need `require`, see [CommonJS](#commonjs).

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

### Result

`ocr()` resolves to an **`OcrResult`** object:

| Field | Meaning |
| --- | --- |
| **`text`** | Full recognized text, lines joined (handy for search or copy-paste). |
| **`lines`** | Each detected line: `text`, confidence `score` (0–1), and `box` (four corner `points` plus a box `score`). Use this for overlays or per-line UI. |
| **`image`** | Input dimensions: `width` and `height`. |
| **`runtime`** | Which ONNX Runtime provider was selected (`provider`), what was tried (`candidates`), and optional timing `benchmarks` when auto-benchmarking is enabled. |

## Model variant

PP-OCRv5 ships two model variants: `mobile` (default) and `server`. The `mobile` variant is smaller and faster, while `server` offers higher accuracy at a larger size.

```ts
// Uses the default mobile model
const ocr = createDefaultPPOcrV5();

// Switch to the server model
const ocr = createDefaultPPOcrV5({ modelVariant: "server" });
```

The same option works with a custom `baseUrl`:

```ts
const ocr = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5",
  modelVariant: "server"
});
```

## Model caching

Enable `cacheModels` to persist downloaded models in the browser's Cache API. Subsequent page loads will read from cache instead of re-downloading:

```ts
const ocr = createDefaultPPOcrV5({ cacheModels: true });
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

Your `baseUrl` should point to a folder that contains the **detection and recognition ONNX pair for the variant you use** (`mobile` by default):

- **Mobile:** `det_mobile.onnx`, `rec_mobile.onnx`
- **Server:** `det_server.onnx`, `rec_server.onnx`

Override filenames with `detectionModelPath` / `recognitionModelPath` if your layout differs.

**Dictionary:** By default the dictionary is loaded from the PaddleOCR project (not from `baseUrl`). To self-host it, set `dictionaryUrl` to your `ppocrv5_dict.txt` URL.

## Default model URL

`createDefaultPPOcrV5` loads weights from:

```text
https://zxc88645.github.io/ffocr/models/pp-ocrv5
```

Use `createPPOcrV5` with your own `baseUrl` when you need to self-host or pin assets.

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

## CommonJS

If you use CommonJS in Node or an older toolchain:

```js
const { createDefaultPPOcrV5 } = require("ffocr");
```

## CDN (no bundler)

Prefer **npm plus a bundler** (Vite, webpack, Rollup, etc.) so dependencies resolve predictably and you can tree-shake. The section below is for cases where you cannot use a bundler.

Pin a specific version in the URL in production (for example `ffocr@0.1.11`).

```js
const { createDefaultPPOcrV5 } = await import("https://cdn.jsdelivr.net/npm/ffocr/+esm");

const ocr = await createDefaultPPOcrV5();
const result = await ocr.ocr("https://zxc88645.github.io/ffocr/demo/example1.png");

console.log(result);
```

## Extra docs

- Model conversion: [`docs/MODEL_CONVERSION.md`](./docs/MODEL_CONVERSION.md)
- Example app: [`examples/vite-demo`](./examples/vite-demo/README.md)
