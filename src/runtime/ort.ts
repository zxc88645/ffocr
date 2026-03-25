import * as ort from "onnxruntime-web";
import type { ExecutionProvider, OrtRuntimeOptions } from "../types";

export type OrtSession = ort.InferenceSession;

let configured = false;

export function configureOrt(options?: OrtRuntimeOptions): void {
  if (configured || !options) {
    return;
  }

  if (options.wasmPaths) {
    ort.env.wasm.wasmPaths = options.wasmPaths;
  }

  if (options.wasmThreads) {
    ort.env.wasm.numThreads = options.wasmThreads;
  }

  configured = true;
}

export async function createSession(
  url: string,
  provider: ExecutionProvider
): Promise<OrtSession> {
  return ort.InferenceSession.create(url, {
    executionProviders: [provider],
    graphOptimizationLevel: "all"
  });
}

export async function runSession(
  session: OrtSession,
  data: Float32Array,
  dims: readonly number[],
  inputName?: string,
  outputName?: string
): Promise<ort.Tensor> {
  const feeds: Record<string, ort.Tensor> = {
    [inputName ?? session.inputNames[0]]: new ort.Tensor("float32", data, dims)
  };

  const outputs = await session.run(feeds);
  const output = outputs[outputName ?? session.outputNames[0]];
  if (!output) {
    throw new Error("ONNX Runtime returned no matching output tensor.");
  }

  return output;
}
