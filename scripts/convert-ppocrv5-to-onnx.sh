#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${WORK_DIR:-${ROOT_DIR}/.model-work}"
OUTPUT_DIR="${OUTPUT_DIR:-${ROOT_DIR}/models/pp-ocrv5}"
PADDLE_TMP_DIR="${WORK_DIR}/paddle"
ONNX_TMP_DIR="${WORK_DIR}/onnx"

DET_SERVER_REPO="${DET_SERVER_REPO:-PaddlePaddle/PP-OCRv5_server_det}"
DET_MOBILE_REPO="${DET_MOBILE_REPO:-PaddlePaddle/PP-OCRv5_mobile_det}"
REC_SERVER_REPO="${REC_SERVER_REPO:-PaddlePaddle/PP-OCRv5_server_rec}"
REC_MOBILE_REPO="${REC_MOBILE_REPO:-PaddlePaddle/PP-OCRv5_mobile_rec}"
HF_REVISION="${HF_REVISION:-main}"
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

download_hf_file() {
  local repo_id="$1"
  local revision="$2"
  local remote_path="$3"
  local destination="$4"
  local encoded_repo

  encoded_repo="${repo_id/\//%2F}"
  curl -L "https://huggingface.co/${repo_id}/resolve/${revision}/${remote_path}?download=true" -o "${destination}"
}

download_hf_model() {
  local repo_id="$1"
  local target_dir="$2"

  rm -rf "${target_dir}"
  mkdir -p "${target_dir}"

  log "Downloading ${repo_id}"
  download_hf_file "${repo_id}" "${HF_REVISION}" "inference.json" "${target_dir}/inference.json"
  download_hf_file "${repo_id}" "${HF_REVISION}" "inference.pdiparams" "${target_dir}/inference.pdiparams"
  download_hf_file "${repo_id}" "${HF_REVISION}" "inference.yml" "${target_dir}/inference.yml"
}

convert_to_onnx() {
  local source_dir="$1"
  local output_dir="$2"

  mkdir -p "${output_dir}"

  log "Converting $(basename "$source_dir") to ONNX"
  PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True paddlex \
    --paddle2onnx \
    --paddle_model_dir "${source_dir}" \
    --onnx_model_dir "${output_dir}" \
    --opset_version 16
}

copy_model_file() {
  local source_dir="$1"
  local output_file="$2"
  local model_file

  model_file="$(find "${source_dir}" -type f -name '*.onnx' | head -n 1)"
  if [[ -z "${model_file}" ]]; then
    printf 'Unable to find ONNX file in %s\n' "${source_dir}" >&2
    exit 1
  fi

  cp "${model_file}" "${output_file}"
}

main() {
  require_command curl
  require_command find
  require_command paddlex

  mkdir -p "${OUTPUT_DIR}" "${ONNX_TMP_DIR}" "${PADDLE_TMP_DIR}"

  log "Installing Paddle2ONNX plugin if needed"
  PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True paddlex --install paddle2onnx

  download_hf_model "${DET_SERVER_REPO}" "${PADDLE_TMP_DIR}/det_server"
  download_hf_model "${DET_MOBILE_REPO}" "${PADDLE_TMP_DIR}/det_mobile"
  download_hf_model "${REC_SERVER_REPO}" "${PADDLE_TMP_DIR}/rec_server"
  download_hf_model "${REC_MOBILE_REPO}" "${PADDLE_TMP_DIR}/rec_mobile"

  convert_to_onnx "${PADDLE_TMP_DIR}/det_server" "${ONNX_TMP_DIR}/det_server"
  convert_to_onnx "${PADDLE_TMP_DIR}/det_mobile" "${ONNX_TMP_DIR}/det_mobile"
  convert_to_onnx "${PADDLE_TMP_DIR}/rec_server" "${ONNX_TMP_DIR}/rec_server"
  convert_to_onnx "${PADDLE_TMP_DIR}/rec_mobile" "${ONNX_TMP_DIR}/rec_mobile"

  copy_model_file "${ONNX_TMP_DIR}/det_server" "${OUTPUT_DIR}/det_server.onnx"
  copy_model_file "${ONNX_TMP_DIR}/det_mobile" "${OUTPUT_DIR}/det_mobile.onnx"
  copy_model_file "${ONNX_TMP_DIR}/rec_server" "${OUTPUT_DIR}/rec_server.onnx"
  copy_model_file "${ONNX_TMP_DIR}/rec_mobile" "${OUTPUT_DIR}/rec_mobile.onnx"

  log "Patching ONNX models for ONNX Runtime WebGPU compatibility"
  node "${ROOT_DIR}/scripts/patch-onnx-webgpu-compat.mjs" \
    "${OUTPUT_DIR}/det_server.onnx" \
    "${OUTPUT_DIR}/det_mobile.onnx" \
    "${OUTPUT_DIR}/rec_server.onnx" \
    "${OUTPUT_DIR}/rec_mobile.onnx"

  log "Downloading dictionary"
  curl -L "${DICT_URL}" -o "${OUTPUT_DIR}/ppocr_keys_v1.txt"

  log "Done"
  log "Output directory: ${OUTPUT_DIR}"
}

main "$@"
