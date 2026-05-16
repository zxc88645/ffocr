# Release & Versioning

This document describes how to cut a new **npm** release for `ffocr`. The project uses **Git tags** to trigger automated publishing; you normally do **not** run `npm publish` locally.

## Automation overview

| Step | Where | What happens |
|------|--------|----------------|
| Push tag `v*` | GitHub | Workflow [`.github/workflows/publish.yml`](../.github/workflows/publish.yml) runs |
| Validate | CI | Tag `vX.Y.Z` must equal `package.json` `version` (`X.Y.Z`) |
| Verify | CI | `npm ci` → `npm run check` → `npm test` → `npm run build` |
| Publish | CI | `npm publish --access public --provenance` |
| Release | CI | GitHub Release created (`softprops/action-gh-release`) with generated notes |

**npm registry** and **GitHub Releases** are updated only after the tag is pushed to `origin`. Pushing commits to `main` alone does not publish.

`package.json` defines `prepublishOnly` (`build` + `check`) for **local** `npm publish`. CI runs build/check explicitly and does not rely on that hook for the release job.

## Standard release procedure

Use this checklist when the user asks to **bump version**, **tag**, or **release**.

### 1. Bump version

From the repository root:

```bash
# patch: 0.1.12 → 0.1.13 (most releases)
npm version patch --no-git-tag-version

# or minor / major when appropriate
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

This updates:

- `package.json`
- `package-lock.json`

Refresh the Vite demo lockfile if it references the workspace package version:

```bash
cd examples/vite-demo
npm install
cd ../..
```

### 2. Commit version bump

Stage only version-related files:

```bash
git add package.json package-lock.json examples/vite-demo/package-lock.json
git commit -m "chore(release): bump version to X.Y.Z"
```

Use the actual version in the message. Follow [Conventional Commits](../copilot-commit-message-instructions.md) (`chore(release):` for version-only commits).

### 3. Push `main`

```bash
git push origin main
```

### 4. Create and push an annotated tag

Tag name **must** be `v` + semver from `package.json` (e.g. version `0.1.13` → tag `v0.1.13`):

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

CI will publish to npm and create the GitHub Release.

### 5. Verify (optional)

- Actions: **Publish** workflow succeeded
- npm: `npm view ffocr version`
- Releases: `https://github.com/zxc88645/ffocr/releases`

## What **not** to do

- **Do not** run `npm publish` locally for routine releases (CI handles it and sets provenance).
- **Do not** tag before bumping `package.json` / lockfiles on `main`.
- **Do not** use a tag that does not match `package.json` (CI fails the version check).
- **Do not** skip pushing the version commit before tagging (the tag should point at the commit that contains the new version).

## Tag ↔ version rule

```
tag v0.1.13  →  package.json "version": "0.1.13"
```

Mismatch example: tag `v0.1.13` while `package.json` is still `0.1.12` → publish job fails at **Validate tag matches package version**.

## Related workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `publish.yml` | Push tags `v*` | npm publish + GitHub Release |
| `ci.yml` | PR / push to `main` | Tests, no publish |
| `deploy-pages.yml` | (see workflow) | Demo site |
| `model-release.yml` | (see workflow) | ONNX model assets, separate from npm package |

Model conversion and staging are documented in [`MODEL_CONVERSION.md`](./MODEL_CONVERSION.md).

## Example (0.1.12 → 0.1.13)

```bash
npm version patch --no-git-tag-version
cd examples/vite-demo && npm install && cd ../..
git add package.json package-lock.json examples/vite-demo/package-lock.json
git commit -m "chore(release): bump version to 0.1.13"
git push origin main
git tag -a v0.1.13 -m "v0.1.13"
git push origin v0.1.13
```

After the Publish workflow completes, `ffocr@0.1.13` is on npm and `v0.1.13` appears under GitHub Releases.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Publish fails at version check | Tag ≠ `package.json` | Fix version or delete/recreate tag on correct commit |
| npm publish fails (version exists) | Tag re-pushed or version not bumped | Bump to a new patch and new tag |
| Demo lockfile out of date | Skipped `npm install` in `examples/vite-demo` | Run `npm install` there and commit `package-lock.json` |

Only create git commits or tags when the user explicitly asks for a release.
