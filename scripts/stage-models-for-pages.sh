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
  require_file "${SOURCE_DIR}/det_server.onnx"
  require_file "${SOURCE_DIR}/det_mobile.onnx"
  require_file "${SOURCE_DIR}/rec_server.onnx"
  require_file "${SOURCE_DIR}/rec_mobile.onnx"
  require_file "${SOURCE_DIR}/ppocrv5_dict.txt"

  mkdir -p "${TARGET_DIR}"

  cp "${SOURCE_DIR}/det_server.onnx" "${TARGET_DIR}/det_server.onnx"
  cp "${SOURCE_DIR}/det_mobile.onnx" "${TARGET_DIR}/det_mobile.onnx"
  cp "${SOURCE_DIR}/rec_server.onnx" "${TARGET_DIR}/rec_server.onnx"
  cp "${SOURCE_DIR}/rec_mobile.onnx" "${TARGET_DIR}/rec_mobile.onnx"
  cp "${SOURCE_DIR}/ppocrv5_dict.txt" "${TARGET_DIR}/ppocrv5_dict.txt"

  log "Staged models for GitHub Pages"
  log "Source: ${SOURCE_DIR}"
  log "Target: ${TARGET_DIR}"
}

main "$@"
