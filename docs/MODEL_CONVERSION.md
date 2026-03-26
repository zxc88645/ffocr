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
├── det_server.onnx   (server detection)
├── det_mobile.onnx   (mobile detection)
├── rec_server.onnx   (server recognition)
├── rec_mobile.onnx   (mobile recognition)
└── ppocr_keys_v1.txt
```

## Model variants

| Variant | Detection | Recognition | Characteristics |
|---------|-----------|-------------|-----------------|
| server  | `det_server.onnx` | `rec_server.onnx` | Higher accuracy, larger model |
| mobile  | `det_mobile.onnx` | `rec_mobile.onnx` | Faster inference, smaller model |

## Optional Pages hosting

```bash
npm run models:stage:pages
```

That copies the files into `site/models/pp-ocrv5/` for GitHub Pages deployment.
