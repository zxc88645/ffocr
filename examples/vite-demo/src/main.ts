import "./style.css";
import { createPPOcrV5 } from "ffocr";

const imageInput = document.querySelector<HTMLInputElement>("#image-input");
const modelBaseUrlInput = document.querySelector<HTMLInputElement>("#model-base-url");
const runButton = document.querySelector<HTMLButtonElement>("#run-button");
const preview = document.querySelector<HTMLImageElement>("#preview");
const status = document.querySelector<HTMLElement>("#status");
const resultText = document.querySelector<HTMLElement>("#result-text");
const resultRuntime = document.querySelector<HTMLElement>("#result-runtime");

function assertElement<T>(value: T | null, label: string): T {
  if (!value) {
    throw new Error(`Missing required element: ${label}`);
  }

  return value;
}

const ui = {
  imageInput: assertElement(imageInput, "#image-input"),
  modelBaseUrlInput: assertElement(modelBaseUrlInput, "#model-base-url"),
  runButton: assertElement(runButton, "#run-button"),
  preview: assertElement(preview, "#preview"),
  status: assertElement(status, "#status"),
  resultText: assertElement(resultText, "#result-text"),
  resultRuntime: assertElement(resultRuntime, "#result-runtime")
};

ui.runButton.addEventListener("click", async () => {
  const file = ui.imageInput.files?.[0];
  if (!file) {
    ui.status.textContent = "Choose an image first.";
    return;
  }

  const modelBaseUrl = ui.modelBaseUrlInput.value.trim();
  if (!modelBaseUrl) {
    ui.status.textContent = "Enter the model base URL first.";
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  ui.preview.src = objectUrl;
  ui.resultText.textContent = "";
  ui.resultRuntime.textContent = "";
  ui.status.textContent = "Loading models and running OCR...";
  ui.runButton.disabled = true;

  const ocr = createPPOcrV5({
    baseUrl: modelBaseUrl,
    warmup: true
  });

  try {
    const result = await ocr.ocr(file);
    ui.resultText.textContent = result.text || "(No text detected)";
    ui.resultRuntime.textContent = JSON.stringify(result.runtime, null, 2);
    ui.status.textContent = `Done. Provider: ${result.runtime.provider}`;
  } catch (error) {
    ui.status.textContent =
      error instanceof Error ? `OCR failed: ${error.message}` : "OCR failed with an unknown error.";
  } finally {
    ocr.dispose();
    ui.runButton.disabled = false;
  }
});
