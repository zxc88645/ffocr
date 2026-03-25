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

By default, the demo expects your converted model files to be served from:

```text
http://localhost:8080/models/pp-ocrv5
```

That directory should contain:

- `det.onnx`
- `rec.onnx`
- `ppocr_keys_v1.txt`

If you host the files elsewhere, change the `Model Base URL` field in the UI.
