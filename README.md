# `ffocr`

Browser-first PaddleOCR wrapper for pure frontend apps. It runs PaddleOCR models converted to ONNX with `onnxruntime-web`, prefers WebGPU when available, and falls back to WASM automatically.

GitHub: <https://github.com/zxc88645/ffocr>

## Why this package

- Latest PaddleOCR is now on the 3.x line, with PP-OCRv5 as the main OCR model family.
- Official PaddleOCR supports ONNX export through Paddle2ONNX, which makes browser deployment practical.
- For modern browsers, `onnxruntime-web` is the most durable frontend runtime path: WebGPU for fast local inference, WASM as the universal fallback.

This package wraps that stack into one browser API:

- `createPaddleOcr()` for setup
- automatic `webgpu -> wasm` runtime selection
- optional runtime benchmarking and cache
- detection + recognition pipeline for browser images

## Important scope

This package intentionally does **not** bundle model weights into npm. PaddleOCR models are large, and the browser-ready setup is usually:

1. Download official PaddleOCR inference models
2. Convert them to ONNX outside the browser
3. Upload `det.onnx` and `rec.onnx` to your own CDN, GitHub Releases, or Hugging Face
4. Point this package at those URLs

## Install

```bash
npm install ffocr onnxruntime-web
```

## Usage

```ts
import { createPaddleOcr, createPPOcrV5BrowserManifest } from "ffocr";

const manifest = createPPOcrV5BrowserManifest({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});

const ocr = createPaddleOcr({
  manifest,
  providerPreference: "auto",
  autoBenchmark: true,
  benchmarkCache: true,
  warmup: true,
  ort: {
    wasmPaths: "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/"
  }
});

await ocr.init();

const result = await ocr.ocr("https://example.com/demo.png");
console.log(result.runtime.provider);
console.log(result.text);
```

## Runtime strategy

`providerPreference: "auto"` behaves like this:

- If WebGPU is available, benchmark `webgpu` and `wasm`
- Cache the faster provider by browser/user agent
- Reuse the cached provider on the next run
- Fall back to `wasm` if WebGPU is unavailable or fails

That is the right default for Apple Silicon devices such as MacBook Pro M3 in Chromium-based browsers, where WebGPU typically wins. Safari support is still less predictable for this stack, so the WASM fallback remains essential.

## Model conversion flow

Use the official PaddleOCR inference models as your source, then convert them with Paddle2ONNX.

Official references:

- PaddleOCR repo: <https://github.com/PaddlePaddle/PaddleOCR>
- Paddle2ONNX doc: <https://www.paddleocr.ai/main/en/version2.x/legacy/paddle2onnx.html>
- ONNX Runtime Web doc: <https://onnxruntime.ai/docs/get-started/with-javascript/web.html>

The helper `officialPaddleOcrSources` includes the official PP-OCRv5 Paddle-format download URLs and the standard dictionary URL.

## API

### `createPaddleOcr(options)`

Creates a reusable OCR instance.

### `createPPOcrV5BrowserManifest({ baseUrl })`

Returns a manifest that expects:

- `${baseUrl}/det.onnx`
- `${baseUrl}/rec.onnx`
- the default dictionary from the official PaddleOCR repository

### `ocr.ocr(source)`

Accepts:

- `ImageData`
- `ImageBitmap`
- `HTMLImageElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `Blob`
- `string` URL

Returns line-level OCR results and the selected runtime provider.

## Publishing checklist

1. Decide the final npm package name in [package.json](/Users/cfh00911141/git/ffocr/package.json).
2. Build and test locally:
   ```bash
   npm install
   npm run build
   npm run check
   ```
3. Login to npm:
   ```bash
   npm login
   ```
4. Publish:
   ```bash
   npm publish --access public
   ```

If you want GitHub to publish for you, add an `NPM_TOKEN` repository secret and use the workflow in [.github/workflows/publish.yml](/Users/cfh00911141/git/ffocr/.github/workflows/publish.yml).

## Model preparation

Use [scripts/convert-ppocrv5-to-onnx.sh](/Users/cfh00911141/git/ffocr/scripts/convert-ppocrv5-to-onnx.sh) to download the official PP-OCRv5 Paddle inference models and convert them into browser-ready ONNX files:

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

That script writes:

- `models/pp-ocrv5/det.onnx`
- `models/pp-ocrv5/rec.onnx`
- `models/pp-ocrv5/ppocr_keys_v1.txt`

Then you can upload `models/pp-ocrv5/` to GitHub Releases, a CDN, or object storage and point `createPPOcrV5BrowserManifest({ baseUrl })` at that URL.

More details:

- [Model conversion guide](/Users/cfh00911141/git/ffocr/docs/MODEL_CONVERSION.md)
- [First release guide](/Users/cfh00911141/git/ffocr/docs/RELEASE.md)

## Current limitations

- The browser detector here uses a lightweight axis-aligned DB-style postprocess, not the full OpenCV/pyclipper polygon pipeline from Python PaddleOCR.
- For heavily rotated text, curved text, or production-grade multilingual layout parsing, you may want a second package later with a more exact polygon postprocess or worker-based execution.
- This package is browser-focused. It is not designed for Node.js server OCR.
