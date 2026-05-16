# Agent guide (`ffocr`)

Instructions for AI assistants working in this repository.

## Project

Browser-first PaddleOCR wrapper (ONNX Runtime Web). Package name: **`ffocr`**. Primary docs: [`README.md`](./README.md).

## Before you change code

- Run `npm run check` and `npm test` when touching library code.
- Commit messages: [Conventional Commits](./copilot-commit-message-instructions.md) (e.g. `fix:`, `feat:`, `chore:`).

## Releases (read this when user says 改版 / tag / publish / 發版)

**Full procedure:** [`docs/RELEASE.md`](./docs/RELEASE.md)

Short checklist:

1. `npm version {patch|minor|major} --no-git-tag-version` at repo root
2. `npm install` in `examples/vite-demo` (updates its lockfile)
3. Commit: `chore(release): bump version to X.Y.Z`
4. `git push origin main`
5. `git tag -a vX.Y.Z -m "vX.Y.Z"` then `git push origin vX.Y.Z`

**npm publish is automatic** via [`.github/workflows/publish.yml`](./.github/workflows/publish.yml) when a `v*` tag is pushed. Do not run local `npm publish` unless the user explicitly needs a manual/debug publish.

Tag `vX.Y.Z` must match `package.json` `version` exactly.

## Other docs

| Topic | File |
|-------|------|
| Release & versioning | [`docs/RELEASE.md`](./docs/RELEASE.md) |
| ONNX model conversion | [`docs/MODEL_CONVERSION.md`](./docs/MODEL_CONVERSION.md) |
| Vite demo | [`examples/vite-demo/README.md`](./examples/vite-demo/README.md) |

## Git safety

- Only commit or push when the user asks.
- Do not force-push `main` unless explicitly requested.
