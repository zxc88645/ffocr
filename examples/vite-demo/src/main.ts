import "./style.css";
import {
  createPPOcrV5,
  getExecutionProviderSupport,
  type ExecutionProvider,
  type OcrResult
} from "ffocr";

const imageInput = document.querySelector<HTMLInputElement>("#image-input");
const modelBaseUrlInput = document.querySelector<HTMLInputElement>("#model-base-url");
const providerSelect = document.querySelector<HTMLSelectElement>("#provider-select");
const providerNote = document.querySelector<HTMLElement>("#provider-note");
const providerDetected = document.querySelector<HTMLElement>("#provider-detected");
const runButton = document.querySelector<HTMLButtonElement>("#run-button");
const preview = document.querySelector<HTMLImageElement>("#preview");
const previewOverlay = document.querySelector<SVGSVGElement>("#preview-overlay");
const status = document.querySelector<HTMLElement>("#status");
const resultText = document.querySelector<HTMLElement>("#result-text");
const resultRuntime = document.querySelector<HTMLElement>("#result-runtime");
const SVG_NS = "http://www.w3.org/2000/svg";

function assertElement<T>(value: T | null, label: string): T {
  if (!value) {
    throw new Error(`Missing required element: ${label}`);
  }

  return value;
}

const ui = {
  imageInput: assertElement(imageInput, "#image-input"),
  modelBaseUrlInput: assertElement(modelBaseUrlInput, "#model-base-url"),
  providerSelect: assertElement(providerSelect, "#provider-select"),
  providerNote: assertElement(providerNote, "#provider-note"),
  providerDetected: assertElement(providerDetected, "#provider-detected"),
  runButton: assertElement(runButton, "#run-button"),
  preview: assertElement(preview, "#preview"),
  previewOverlay: assertElement(previewOverlay, "#preview-overlay"),
  status: assertElement(status, "#status"),
  resultText: assertElement(resultText, "#result-text"),
  resultRuntime: assertElement(resultRuntime, "#result-runtime")
};

function getDefaultModelBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:8080/models/pp-ocrv5";
  }

  return new URL("../models/pp-ocrv5/", window.location.href).toString().replace(/\/$/, "");
}

function formatProviderLabel(provider: ExecutionProvider): string {
  switch (provider) {
    case "webgpu":
      return "WebGPU";
    case "webnn":
      return "WebNN";
    case "webgl":
      return "WebGL";
    case "wasm":
      return "WASM";
  }
}

function updateProviderUi(): void {
  const support = getExecutionProviderSupport();
  const available = support.filter((item) => item.available);
  const unavailable = support.filter((item) => !item.available);

  ui.providerSelect.replaceChildren();

  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent =
    available.length > 1
      ? `Auto (${formatProviderLabel(available[0]?.provider ?? "wasm")} first)`
      : `Auto (${formatProviderLabel(available[0]?.provider ?? "wasm")})`;
  ui.providerSelect.append(autoOption);

  available.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.provider;
    option.textContent = formatProviderLabel(item.provider);
    ui.providerSelect.append(option);
  });

  ui.providerSelect.value = "auto";
  ui.providerNote.textContent =
    available.length > 1
      ? "Auto uses the first available provider in priority order: WebGPU, WebNN, WebGL, then WASM."
      : "Only one provider is available in this browser, so auto and manual selection will use the same runtime.";

  ui.providerDetected.replaceChildren(
    ...support.map((item) => {
      const badge = document.createElement("span");
      badge.className = item.available ? "provider-pill is-available" : "provider-pill is-unavailable";
      badge.textContent = `${formatProviderLabel(item.provider)} ${item.available ? "available" : "unavailable"}`;
      return badge;
    })
  );

  if (available.length === 0) {
    ui.providerNote.textContent =
      "No browser runtime was detected up front. The demo will still try WASM when you run OCR.";
  }

  if (unavailable.length === 0) {
    ui.providerDetected.dataset.allAvailable = "true";
  } else {
    delete ui.providerDetected.dataset.allAvailable;
  }
}

function clearOverlay(): void {
  ui.previewOverlay.replaceChildren();
  ui.previewOverlay.removeAttribute("viewBox");
  ui.previewOverlay.classList.add("is-empty");
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}

function renderOverlay(result: OcrResult): void {
  clearOverlay();
  ui.previewOverlay.setAttribute("viewBox", `0 0 ${result.image.width} ${result.image.height}`);
  ui.previewOverlay.classList.remove("is-empty");

  result.lines.forEach((line, index) => {
    const [topLeft] = line.box.points;
    const points = line.box.points.map((point) => `${point.x},${point.y}`).join(" ");
    const label = `${index + 1}. ${line.text || "(blank)"}`;
    const labelWidth = Math.min(
      result.image.width - topLeft.x,
      Math.max(54, label.length * 7.2)
    );
    const labelHeight = 18;
    const labelX = Math.max(0, Math.min(topLeft.x, result.image.width - labelWidth));
    const labelY = Math.max(0, topLeft.y - labelHeight - 4);

    const polygon = createSvgElement("polygon");
    polygon.setAttribute("points", points);
    polygon.setAttribute("class", "ocr-box");

    const labelBackground = createSvgElement("rect");
    labelBackground.setAttribute("x", `${labelX}`);
    labelBackground.setAttribute("y", `${labelY}`);
    labelBackground.setAttribute("width", `${labelWidth}`);
    labelBackground.setAttribute("height", `${labelHeight}`);
    labelBackground.setAttribute("rx", "5");
    labelBackground.setAttribute("class", "ocr-label-bg");

    const text = createSvgElement("text");
    text.setAttribute("x", `${labelX + 6}`);
    text.setAttribute("y", `${labelY + 12.5}`);
    text.setAttribute("class", "ocr-label");
    text.textContent = label;

    ui.previewOverlay.append(polygon, labelBackground, text);
  });
}

ui.modelBaseUrlInput.value = getDefaultModelBaseUrl();
updateProviderUi();
clearOverlay();

ui.imageInput.addEventListener("change", () => {
  clearOverlay();
  ui.resultText.textContent = "";
  ui.resultRuntime.textContent = "";
});

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
  clearOverlay();
  ui.resultText.textContent = "";
  ui.resultRuntime.textContent = "";
  ui.status.textContent = "Loading models, checking the selected runtime, and running OCR...";
  ui.runButton.disabled = true;

  const selectedProvider = ui.providerSelect.value as "auto" | ExecutionProvider;
  const ocr = createPPOcrV5({
    baseUrl: modelBaseUrl,
    providerPreference: selectedProvider === "auto" ? "auto" : selectedProvider,
    warmup: true
  });

  try {
    const result = await ocr.ocr(file);
    ui.resultText.textContent = result.text || "(No text detected)";
    ui.resultRuntime.textContent = JSON.stringify(result.runtime, null, 2);
    renderOverlay(result);
    ui.status.textContent =
      selectedProvider === "auto"
        ? `Done. Auto selected ${formatProviderLabel(result.runtime.provider)}.`
        : `Done. Provider: ${formatProviderLabel(result.runtime.provider)}.`;
  } catch (error) {
    clearOverlay();
    ui.status.textContent =
      error instanceof Error ? `OCR failed: ${error.message}` : "OCR failed with an unknown error.";
  } finally {
    ocr.dispose();
    ui.runButton.disabled = false;
    URL.revokeObjectURL(objectUrl);
  }
});
