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

That directory should contain:

- `det_server.onnx`
- `det_mobile.onnx`
- `rec_server.onnx`
- `rec_mobile.onnx`
- `ppocrv5_dict.txt`

If you host the files elsewhere, change the `Model Base URL` field in the UI.

For GitHub Pages deployment, the demo is built to `site/demo/` and defaults to:

```text
https://zxc88645.github.io/ffocr/models/pp-ocrv5
```
