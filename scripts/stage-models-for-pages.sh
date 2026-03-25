#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${SOURCE_DIR:-${ROOT_DIR}/models/pp-ocrv5}"
SITE_DIR="${SITE_DIR:-${ROOT_DIR}/site}"
TARGET_DIR="${TARGET_DIR:-${SITE_DIR}/models/pp-ocrv5}"

require_file() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    printf 'Missing required file: %s\n' "${path}" >&2
    exit 1
  fi
}

log() {
  printf '[ffocr] %s\n' "$1"
}

main() {
  require_file "${SOURCE_DIR}/det.onnx"
  require_file "${SOURCE_DIR}/rec.onnx"
  require_file "${SOURCE_DIR}/ppocr_keys_v1.txt"

  mkdir -p "${TARGET_DIR}"

  cp "${SOURCE_DIR}/det.onnx" "${TARGET_DIR}/det.onnx"
  cp "${SOURCE_DIR}/rec.onnx" "${TARGET_DIR}/rec.onnx"
  cp "${SOURCE_DIR}/ppocr_keys_v1.txt" "${TARGET_DIR}/ppocr_keys_v1.txt"

  log "Staged models for GitHub Pages"
  log "Source: ${SOURCE_DIR}"
  log "Target: ${TARGET_DIR}"
}

main "$@"
