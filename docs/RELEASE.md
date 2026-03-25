# First Release Flow

This repo is ready for a first release. Use this checklist in order.

## 1. Verify local package

```bash
npm install
npm run check
npm run build
npm pack --dry-run --cache .npm-cache
```

## 2. Convert and host model files

```bash
./scripts/convert-ppocrv5-to-onnx.sh
```

Upload `models/pp-ocrv5/` somewhere public and stable. Then update your app example or docs with the final `baseUrl`.

## 3. Push the first commit

```bash
git add .
git commit -m "feat: initial ffocr release"
git push -u origin main
```

## 4. Publish to npm manually

Make sure you are logged into the correct npm account:

```bash
npm whoami
npm login
npm publish --access public
```

## 5. Enable GitHub Actions publishing

Add an `NPM_TOKEN` repository secret in GitHub:

1. Open the repository settings
2. Go to `Secrets and variables` -> `Actions`
3. Create a new repository secret named `NPM_TOKEN`

After that, you can publish by creating a GitHub Release.

## 6. Create the first GitHub Release

```bash
git tag v0.1.0
git push origin v0.1.0
```

Then create a GitHub Release for tag `v0.1.0`. The workflow in `.github/workflows/publish.yml` will build and publish the package.

## Notes

- The npm package name is currently `ffocr`.
- If `ffocr` becomes unavailable before publication, switch to a scoped package such as `@zxc88645/ffocr`.
- The package publishes only the library code. Model files should be hosted separately.
