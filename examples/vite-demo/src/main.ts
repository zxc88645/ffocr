import "./style.css";
import {
  createPPOcrV5,
  getExecutionProviderSupport,
  type ExecutionProvider,
  type OcrProgress,
  type OcrResult,
  type PaddleOcrWeb,
  type PPOcrV5ModelVariant
} from "ffocr";

const SVG_NS = "http://www.w3.org/2000/svg";

function assertElement<T>(value: T | null, label: string): T {
  if (!value) {
    throw new Error(`Missing required element: ${label}`);
  }
  return value;
}

const ui = {
  imageInput: assertElement(document.querySelector<HTMLInputElement>("#image-input"), "#image-input"),
  modelBaseUrlInput: assertElement(document.querySelector<HTMLInputElement>("#model-base-url"), "#model-base-url"),
  variantSelect: assertElement(document.querySelector<HTMLSelectElement>("#variant-select"), "#variant-select"),
  providerSelect: assertElement(document.querySelector<HTMLSelectElement>("#provider-select"), "#provider-select"),
  providerNote: assertElement(document.querySelector<HTMLElement>("#provider-note"), "#provider-note"),
  providerDetected: assertElement(document.querySelector<HTMLElement>("#provider-detected"), "#provider-detected"),
  confidenceSlider: assertElement(document.querySelector<HTMLInputElement>("#confidence-slider"), "#confidence-slider"),
  confidenceValue: assertElement(document.querySelector<HTMLOutputElement>("#confidence-value"), "#confidence-value"),
  runButton: assertElement(document.querySelector<HTMLButtonElement>("#run-button"), "#run-button"),
  preview: assertElement(document.querySelector<HTMLImageElement>("#preview"), "#preview"),
  previewOverlay: assertElement(document.querySelector<SVGSVGElement>("#preview-overlay"), "#preview-overlay"),
  status: assertElement(document.querySelector<HTMLElement>("#status"), "#status"),
  resultText: assertElement(document.querySelector<HTMLElement>("#result-text"), "#result-text"),
  resultLog: assertElement(document.querySelector<HTMLElement>("#result-log"), "#result-log"),
  resultRuntime: assertElement(document.querySelector<HTMLElement>("#result-runtime"), "#result-runtime")
};

let lastResult: OcrResult | null = null;

let cachedOcr: PaddleOcrWeb | null = null;
let cachedOcrKey = "";

function getOrCreateOcr(
  baseUrl: string,
  variant: PPOcrV5ModelVariant,
  provider: "auto" | ExecutionProvider
): PaddleOcrWeb {
  const key = `${baseUrl}|${variant}|${provider}`;
  if (cachedOcr && cachedOcrKey === key) {
    return cachedOcr;
  }
  cachedOcr?.dispose();
  cachedOcr = createPPOcrV5({
    baseUrl,
    modelVariant: variant,
    providerPreference: provider === "auto" ? "auto" : provider,
    warmup: true,
    cacheModels: true
  });
  cachedOcrKey = key;
  return cachedOcr;
}

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

function getMinConfidence(): number {
  return parseFloat(ui.confidenceSlider.value);
}

function renderOverlay(result: OcrResult): void {
  clearOverlay();
  ui.previewOverlay.setAttribute("viewBox", `0 0 ${result.image.width} ${result.image.height}`);
  ui.previewOverlay.classList.remove("is-empty");

  const minConf = getMinConfidence();
  const filteredLines = result.lines.filter((line) => line.score >= minConf);

  filteredLines.forEach((line, index) => {
    const [topLeft] = line.box.points;
    const points = line.box.points.map((point) => `${point.x},${point.y}`).join(" ");
    const label = `${index + 1}. ${line.text || "(blank)"} [${(line.score * 100).toFixed(1)}%]`;
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

function updateFilteredOutput(): void {
  if (!lastResult) return;

  const minConf = getMinConfidence();
  const filteredLines = lastResult.lines.filter((line) => line.score >= minConf);
  const filteredText = filteredLines.map((line) => line.text).join("\n");
  ui.resultText.textContent = filteredText || "(No text above confidence threshold)";

  renderOverlay(lastResult);
}

function formatRawLog(result: OcrResult): string {
  const lines = result.lines.map((line, i) => ({
    index: i + 1,
    text: line.text,
    confidence: +(line.score * 100).toFixed(2),
    box: {
      score: +line.box.score.toFixed(4),
      points: line.box.points.map((p) => ({ x: +p.x.toFixed(1), y: +p.y.toFixed(1) }))
    }
  }));

  return JSON.stringify(
    {
      image: result.image,
      runtime: result.runtime,
      totalLines: result.lines.length,
      lines
    },
    null,
    2
  );
}

ui.modelBaseUrlInput.value = getDefaultModelBaseUrl();
updateProviderUi();
clearOverlay();

ui.confidenceSlider.addEventListener("input", () => {
  ui.confidenceValue.textContent = parseFloat(ui.confidenceSlider.value).toFixed(2);
  updateFilteredOutput();
});

ui.imageInput.addEventListener("change", () => {
  clearOverlay();
  lastResult = null;
  ui.resultText.textContent = "";
  ui.resultLog.textContent = "";
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
  lastResult = null;
  ui.resultText.textContent = "";
  ui.resultLog.textContent = "";
  ui.resultRuntime.textContent = "";

  const selectedProvider = ui.providerSelect.value as "auto" | ExecutionProvider;
  const selectedVariant = ui.variantSelect.value as PPOcrV5ModelVariant;

  ui.runButton.disabled = true;

  const progressLabels: Record<OcrProgress["phase"], string> = {
    loading_dictionary: "Loading dictionary…",
    loading_detection_model: "Loading detection model…",
    loading_recognition_model: "Loading recognition model…",
    warmup: "Warming up models…",
    preprocessing: "Preprocessing image…",
    detecting: "Running text detection…",
    recognizing: "Recognizing text…"
  };

  const ocr = getOrCreateOcr(modelBaseUrl, selectedVariant, selectedProvider);

  try {
    const startTime = performance.now();
    const result = await ocr.ocr(file, {
      onProgress(progress) {
        let label = progressLabels[progress.phase];
        if (progress.loaded != null) {
          const loadedMB = (progress.loaded / 1024 / 1024).toFixed(1);
          if (progress.totalBytes != null) {
            const totalMB = (progress.totalBytes / 1024 / 1024).toFixed(1);
            const pct = Math.round((progress.loaded / progress.totalBytes) * 100);
            label = `${progressLabels[progress.phase]} ${loadedMB}/${totalMB} MB (${pct}%)`;
          } else {
            label = `${progressLabels[progress.phase]} ${loadedMB} MB`;
          }
        } else if (progress.phase === "recognizing" && progress.total != null) {
          label = `Recognizing text (${progress.current}/${progress.total})…`;
        }
        ui.status.textContent = label;
      }
    });
    const elapsed = performance.now() - startTime;

    lastResult = result;
    updateFilteredOutput();
    ui.resultLog.textContent = formatRawLog(result);
    ui.resultRuntime.textContent = JSON.stringify(result.runtime, null, 2);

    const providerLabel = formatProviderLabel(result.runtime.provider);
    ui.status.textContent =
      `Done in ${(elapsed / 1000).toFixed(2)}s · ${result.lines.length} line(s) · ` +
      `${selectedVariant} variant · ${providerLabel}`;
  } catch (error) {
    clearOverlay();
    ui.status.textContent =
      error instanceof Error ? `OCR failed: ${error.message}` : "OCR failed with an unknown error.";
  } finally {
    ui.runButton.disabled = false;
    URL.revokeObjectURL(objectUrl);
  }
});
