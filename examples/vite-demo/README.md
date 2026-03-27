# Vite Demo

This demo shows the easiest package integration path for a browser app.

## Run

```bash
cd ../..
npm install
npm run build

cd examples/vite-demo
npm install
npm run dev
```

By default, local development expects your converted model files to be served from:

```text
http://localhost:8080/models/pp-ocrv5
```

That directory must include the ONNX pair for the variant you select in the UI (`mobile` by default):

- **Mobile:** `det_mobile.onnx`, `rec_mobile.onnx`
- **Server:** `det_server.onnx`, `rec_server.onnx`

Include all four ONNX files if you switch variants in the UI. The demo does not set `dictionaryUrl`; the package loads the dictionary from PaddleOCR by default, so `ppocrv5_dict.txt` in this folder is not required unless you change that in code.

If you host the files elsewhere, change the `Model Base URL` field in the UI.

For GitHub Pages deployment, the demo is built to `site/demo/` and defaults to:

```text
https://zxc88645.github.io/ffocr/models/pp-ocrv5
```
