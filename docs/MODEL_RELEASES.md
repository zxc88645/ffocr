# Model Releases

Use GitHub Releases to host the default browser model files.

## Release tag

Use a dedicated tag for hosted model assets:

```text
models-ppocrv5-v2
```

That matches the current default URL exported by the package.

## Required asset names

Upload these files to the GitHub Release:

- `det_server.onnx` — PP-OCRv5 server detection model
- `det_mobile.onnx` — PP-OCRv5 mobile detection model
- `rec_server.onnx` — PP-OCRv5 server recognition model
- `rec_mobile.onnx` — PP-OCRv5 mobile recognition model
- `ppocrv5_dict.txt`

## Prepare assets

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

Files will be written to:

```text
models/pp-ocrv5/
```

## Automated release flow

1. Convert the models:
   ```bash
   ./scripts/convert-ppocrv5-to-onnx.sh
   ```
2. Stage them into the tracked release/pages folder:
   ```bash
   npm run models:stage:pages
   ```
3. Commit the updated files in `site/models/pp-ocrv5/`
4. Push `main`
5. Push a tag such as:
   ```bash
   git tag models-ppocrv5-v2
   git push origin models-ppocrv5-v2
   ```

The workflow in `.github/workflows/model-release.yml` will automatically create the GitHub Release and upload:

- `det_server.onnx`
- `det_mobile.onnx`
- `rec_server.onnx`
- `rec_mobile.onnx`
- `ppocrv5_dict.txt`

## Default package URL

The package will use:

```text
https://github.com/zxc88645/ffocr/releases/download/models-ppocrv5-v2
```

## Updating models later

If you publish a new model set:

1. Stage the new files into `site/models/pp-ocrv5/`
2. Commit and push `main`
3. Push a new tag such as `models-ppocrv5-v3`
4. Update `DEFAULT_MODEL_RELEASE_TAG` in `src/presets/ppocrv5.ts`
5. Publish a new npm package version
