# Release Flow

## First publish

Trusted publishing with OIDC only works after the package already exists on npm.

```bash
npm login
npm publish --access public
```

## Later releases

After the first publish, bump the version and push a tag:

```bash
git tag v0.1.3
git push origin v0.1.3
```

The publish workflow will build, publish to npm, and create a GitHub Release.

## Model hosting

If you use the built-in GitHub Pages flow:

```bash
./scripts/convert-ppocrv5-to-onnx.sh
npm run models:stage:pages
git add site
git commit -m "chore: update hosted models"
git push origin main
```
