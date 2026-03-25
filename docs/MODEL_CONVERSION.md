# PP-OCRv5 to ONNX

This project uses the official PaddleOCR PP-OCRv5 Paddle inference models as the source format, then converts them to ONNX for browser inference.

## Official references

- PaddleOCR repository: <https://github.com/PaddlePaddle/PaddleOCR>
- PaddleOCR ONNX conversion doc: <https://www.paddleocr.ai/v3.0.0/en/version3.x/deployment/obtaining_onnx_models.html>
- ONNX Runtime Web doc: <https://onnxruntime.ai/docs/get-started/with-javascript/web.html>

## Prerequisites

You need a machine with:

- `python3`
- `pip`
- `curl`
- `tar`

Install PaddleX first. The script expects the `paddlex` CLI to be available:

```bash
python3 -m pip install -U paddlex
```

## Convert models

From the repo root:

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

The script will:

1. Install the Paddle2ONNX plugin through `paddlex --install paddle2onnx`
2. Download the official PP-OCRv5 detection and recognition Paddle inference archives
3. Convert them to ONNX
4. Write browser-facing files into `models/pp-ocrv5/`

Expected output:

```text
models/pp-ocrv5/
├── det.onnx
├── rec.onnx
└── ppocr_keys_v1.txt
```

## Override sources

You can override URLs or output paths with environment variables:

```bash
OUTPUT_DIR=/tmp/ppocr-web \
DET_URL=https://.../custom_det.tar \
REC_URL=https://.../custom_rec.tar \
./scripts/convert-ppocrv5-to-onnx.sh
```

Supported variables:

- `WORK_DIR`
- `OUTPUT_DIR`
- `DET_URL`
- `REC_URL`
- `DICT_URL`

## Publish model assets

After conversion, upload `models/pp-ocrv5/` to one of these:

- GitHub Releases
- Cloudflare R2
- AWS S3
- Hugging Face
- any static CDN

Then use that base URL in `createPPOcrV5BrowserManifest({ baseUrl })`.
