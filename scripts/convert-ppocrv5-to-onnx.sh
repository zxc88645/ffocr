#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${WORK_DIR:-${ROOT_DIR}/.model-work}"
OUTPUT_DIR="${OUTPUT_DIR:-${ROOT_DIR}/models/pp-ocrv5}"
PADDLE_TMP_DIR="${WORK_DIR}/paddle"
ONNX_TMP_DIR="${WORK_DIR}/onnx"

DET_URL="${DET_URL:-https://paddleocr.bj.bcebos.com/PP-OCRv5/chinese/ch_PP-OCRv5_det_infer.tar}"
REC_URL="${REC_URL:-https://paddleocr.bj.bcebos.com/PP-OCRv5/chinese/ch_PP-OCRv5_rec_infer.tar}"
DICT_URL="${DICT_URL:-https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/ppocr_keys_v1.txt}"

log() {
  printf '[ffocr] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

find_paddle_model_dir() {
  local search_root="$1"
  local pdmodel_path

  pdmodel_path="$(find "${search_root}" -type f -name 'inference.pdmodel' -print -quit)"
  if [[ -z "${pdmodel_path}" ]]; then
    printf 'Unable to find inference.pdmodel under %s\n' "${search_root}" >&2
    exit 1
  fi

  dirname "${pdmodel_path}"
}

download_and_extract() {
  local url="$1"
  local target_name="$2"
  local archive_path="${PADDLE_TMP_DIR}/${target_name}.tar"
  local target_dir="${PADDLE_TMP_DIR}/${target_name}"

  mkdir -p "${PADDLE_TMP_DIR}"
  rm -rf "${target_dir}"

  log "Downloading ${target_name} model"
  curl -L "$url" -o "${archive_path}"

  log "Extracting ${target_name} model"
  mkdir -p "${target_dir}"
  tar -xf "${archive_path}" -C "${target_dir}"
}

convert_to_onnx() {
  local source_dir="$1"
  local output_dir="$2"

  mkdir -p "${output_dir}"

  log "Converting $(basename "$source_dir") to ONNX"
  paddlex \
    --paddle2onnx \
    --paddle_model_dir "${source_dir}" \
    --onnx_model_dir "${output_dir}" \
    --opset_version 16
}

copy_model_file() {
  local source_dir="$1"
  local output_file="$2"
  local model_file

  model_file="$(find "${source_dir}" -type f \( -name '*.onnx' -o -name 'model.onnx' \) | head -n 1)"
  if [[ -z "${model_file}" ]]; then
    printf 'Unable to find ONNX file in %s\n' "${source_dir}" >&2
    exit 1
  fi

  cp "${model_file}" "${output_file}"
}

main() {
  require_command curl
  require_command tar
  require_command find
  require_command dirname
  require_command paddlex

  mkdir -p "${OUTPUT_DIR}" "${ONNX_TMP_DIR}"

  log "Installing Paddle2ONNX plugin if needed"
  paddlex --install paddle2onnx

  download_and_extract "${DET_URL}" "det"
  download_and_extract "${REC_URL}" "rec"

  DET_MODEL_DIR="$(find_paddle_model_dir "${PADDLE_TMP_DIR}/det")"
  REC_MODEL_DIR="$(find_paddle_model_dir "${PADDLE_TMP_DIR}/rec")"

  convert_to_onnx "${DET_MODEL_DIR}" "${ONNX_TMP_DIR}/det"
  convert_to_onnx "${REC_MODEL_DIR}" "${ONNX_TMP_DIR}/rec"

  copy_model_file "${ONNX_TMP_DIR}/det" "${OUTPUT_DIR}/det.onnx"
  copy_model_file "${ONNX_TMP_DIR}/rec" "${OUTPUT_DIR}/rec.onnx"

  log "Downloading dictionary"
  curl -L "${DICT_URL}" -o "${OUTPUT_DIR}/ppocr_keys_v1.txt"

  log "Done"
  log "Output directory: ${OUTPUT_DIR}"
}

main "$@"
