#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import onnxProto from "onnx-proto";

const { onnx } = onnxProto;

function patchMaxPoolCeilMode(modelPath) {
  const absolutePath = path.resolve(modelPath);
  const data = fs.readFileSync(absolutePath);
  const model = onnx.ModelProto.decode(data);

  let updatedCount = 0;

  for (const node of model.graph?.node ?? []) {
    if (node.opType !== "MaxPool") {
      continue;
    }

    for (const attribute of node.attribute ?? []) {
      if (attribute.name !== "ceil_mode") {
        continue;
      }

      if (Number(attribute.i ?? 0) !== 1) {
        continue;
      }

      attribute.i = 0;
      updatedCount += 1;
      console.log(
        `[ffocr] Patched ${path.basename(absolutePath)} node "${node.name || "(unnamed)"}": ceil_mode 1 -> 0`
      );
    }
  }

  if (updatedCount === 0) {
    console.log(`[ffocr] No WebGPU compatibility changes needed for ${path.basename(absolutePath)}`);
    return;
  }

  const output = onnx.ModelProto.encode(model).finish();
  fs.writeFileSync(absolutePath, output);
  console.log(`[ffocr] Wrote ${updatedCount} WebGPU compatibility patch(es) to ${absolutePath}`);
}

const modelPaths = process.argv.slice(2);

if (modelPaths.length === 0) {
  console.error("Usage: node scripts/patch-onnx-webgpu-compat.mjs <model.onnx> [more-models.onnx...]");
  process.exit(1);
}

for (const modelPath of modelPaths) {
  patchMaxPoolCeilMode(modelPath);
}
