# `ffocr`

Browser-first OCR for frontend apps, built on PaddleOCR models converted to ONNX and executed with `onnxruntime-web`.

GitHub: <https://github.com/zxc88645/ffocr>

## Quick start

```bash
npm install ffocr
```

```ts
import { createPPOcrV5 } from "ffocr";

const ocr = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});

const result = await ocr.ocr(fileOrBlobOrUrl);
console.log(result.text);
```

## Why this package

- Uses the current PaddleOCR 3.x / PP-OCRv5 direction
- Runs fully in the browser
- Prefers `webgpu`, falls back to `wasm`
- Wraps detection + recognition into one simple API
- Lets you host model files separately instead of bloating npm

## Easiest API

For most users, this is the main entry point:

```ts
import { createPPOcrV5, ocrWithPPOcrV5 } from "ffocr";

const reusable = createPPOcrV5({
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5",
  warmup: true
});

const result = await reusable.ocr(file);

const oneShot = await ocrWithPPOcrV5(file, {
  baseUrl: "https://your-cdn.example.com/models/pp-ocrv5"
});
```

`createPPOcrV5()` automatically supplies:

- the PP-OCRv5 browser manifest
- the default PaddleOCR dictionary URL
- a recommended ONNX Runtime WASM asset path

## Lower-level API

If you need full control, you can build the manifest yourself:

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
  warmup: true
});

const result = await ocr.ocr("https://example.com/demo.png");
```

## Inputs

`ocr.ocr(source)` accepts:

- `ImageData`
- `ImageBitmap`
- `HTMLImageElement`
- `HTMLCanvasElement`
- `OffscreenCanvas`
- `Blob`
- `string` URL

## Runtime selection

With `providerPreference: "auto"`:

- `webgpu` is tried when available
- `webgpu` and `wasm` can be benchmarked
- the faster provider can be cached by browser/user agent
- `wasm` remains the fallback

That is a good default for Apple Silicon devices such as Mac M3 machines in Chromium-based browsers.

## Model files

This package does not ship model weights inside npm. You prepare and host:

- `det.onnx`
- `rec.onnx`
- `ppocr_keys_v1.txt`

Then point `baseUrl` to that folder.

## Convert PP-OCRv5 to ONNX

Use the included script:

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

Output:

- `models/pp-ocrv5/det.onnx`
- `models/pp-ocrv5/rec.onnx`
- `models/pp-ocrv5/ppocr_keys_v1.txt`

Docs:

- [Model conversion guide](/Users/cfh00911141/git/ffocr/docs/MODEL_CONVERSION.md)
- [First release guide](/Users/cfh00911141/git/ffocr/docs/RELEASE.md)

## Minimal static hosting

This repo includes a minimal GitHub Pages hosting path for model files.

After conversion:

```bash
npm run models:stage:pages
```

That copies the converted files into `site/models/pp-ocrv5/`. Commit those files and push `main`, and the Pages workflow will deploy them.

If this is the first Pages deployment for the repo, set GitHub Pages to use GitHub Actions in repository settings.

Expected model base URL:

```text
https://zxc88645.github.io/ffocr/models/pp-ocrv5
```

## Demo app

A runnable example app is included in [examples/vite-demo](/Users/cfh00911141/git/ffocr/examples/vite-demo/README.md).

Typical local flow:

1. Convert the model with `./scripts/convert-ppocrv5-to-onnx.sh`
2. Serve `models/pp-ocrv5/` from a local static server
3. Run the demo:
   ```bash
   cd examples/vite-demo
   npm install
   npm run dev
   ```

## Publish package

```bash
npm install
npm run build
npm run check
npm pack --dry-run --cache .npm-cache
git tag v0.1.1
git push origin v0.1.1
```

With npm trusted publishing configured for this repository through OIDC, pushing a `v*` tag will publish to npm automatically and create a GitHub Release automatically.

## Current limitations

- Detection postprocess is a browser-friendly axis-aligned DB-style implementation, not the full Python PaddleOCR polygon pipeline
- Heavily rotated or curved text can need a more exact postprocess later
- This package is browser-focused, not a server OCR library
