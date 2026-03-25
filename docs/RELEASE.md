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
npm run models:stage:pages
```

Commit `site/models/pp-ocrv5/` and push `main` to deploy them on GitHub Pages, or upload the converted files to any other static host.

If this is your first Pages deployment for the repo, open GitHub repository settings and set Pages to use GitHub Actions.

## 3. Push the first commit

```bash
git add .
git commit -m "feat: initial ffocr release"
git push -u origin main
```

## 4. Configure automated publishing

Add an `NPM_TOKEN` repository secret in GitHub:

1. Open repository settings
2. Go to `Secrets and variables` -> `Actions`
3. Create a repository secret named `NPM_TOKEN`

Once that secret exists, pushing a version tag will publish to npm automatically and create a GitHub Release automatically.

## 5. Publish to npm manually if needed

Make sure you are logged into the correct npm account:

```bash
npm whoami
npm login
npm publish --access public
```

## 6. Trigger automatic publish by tag push

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow in [.github/workflows/publish.yml](/Users/cfh00911141/git/ffocr/.github/workflows/publish.yml) will build the package, publish it to npm, and create the GitHub Release from that tag.

## 7. GitHub Pages model URL

If you use the built-in Pages hosting flow, your model base URL will be:

```text
https://zxc88645.github.io/ffocr/models/pp-ocrv5
```

## Notes

- The npm package name is currently `ffocr`.
- If `ffocr` becomes unavailable before publication, switch to a scoped package such as `@zxc88645/ffocr`.
- The package publishes only the library code. Model files should be hosted separately.
