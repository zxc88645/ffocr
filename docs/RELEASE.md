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

Set up npm trusted publishing with GitHub Actions using OIDC:

1. Open the package settings on npm
2. Add a trusted publisher
3. Choose `GitHub Actions`
4. Set user to `zxc88645`
5. Set repository to `ffocr`
6. Set workflow filename to `publish.yml`

Once that trust is configured, pushing a version tag will publish to npm automatically and create a GitHub Release automatically.

## 5. Publish to npm manually if needed

Make sure you are logged into the correct npm account:

```bash
npm whoami
npm login
npm publish --access public
```

## 6. Trigger automatic publish by tag push

```bash
git tag v0.1.1
git push origin v0.1.1
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
