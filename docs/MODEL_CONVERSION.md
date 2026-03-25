# Model Conversion

Convert official PP-OCRv5 Paddle inference models into ONNX files for browser use.

## Prerequisites

```bash
python3 -m pip install -U paddlex
```

You also need `curl` and `tar`.

## Convert

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

The conversion script also applies a small post-processing patch so the exported PP-OCRv5 detection model stays compatible with ONNX Runtime WebGPU.

Output:

```text
models/pp-ocrv5/
├── det.onnx
├── rec.onnx
└── ppocr_keys_v1.txt
```

## Optional Pages hosting

```bash
npm run models:stage:pages
```

That copies the files into `site/models/pp-ocrv5/` for GitHub Pages deployment.
