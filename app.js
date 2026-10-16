// The Assets page: wires the issue-number field and the download button to the
// poster renderer in poster.js.

import {
  FONT_FAMILY,
  LABEL,
  POSTER,
  createContext,
  describeLogoFailure,
  drawPoster,
  loadLogo,
} from "./poster.js";

const FILENAME = {
  prefix: "ai5nines-issue",
  maxSuffixLength: 64,
  illegal: /[\\/:*?"<>|\u0000-\u001f\u007f]/g,
};

const DEFAULT_VALUE = "13";

// The number is drawn very large, so the design is tuned for the two- and three-digit
// issues the newsletter actually has. The field is capped rather than letting a stray
// long value shrink the number down to a size nothing was designed for.
const MAX_DIGITS = 3;

const state = {
  value: DEFAULT_VALUE,
};

let previousExportUrl = null;
let renderQueued = false;

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function updatePreview() {
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("poster");
  const cssWidth = stage.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(
    1,
    Math.round((pixelWidth * POSTER.height) / POSTER.width),
  );

  const ctx = createContext(canvas, pixelWidth, pixelHeight);
  drawPoster(ctx, state.value);
  canvas.setAttribute(
    "aria-label",
    `Poster preview: logo with ${LABEL.hash}${state.value}`,
  );
}

function requestRender() {
  if (renderQueued) {
    return;
  }
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    updatePreview();
  });
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

function sanitizeForFilename(value) {
  const withoutHashes = value.trim().replace(/^#+/, "");
  const withoutIllegal = withoutHashes.replace(FILENAME.illegal, "");
  const collapsed = withoutIllegal.replace(/\s+/g, "-");
  const trimmed = collapsed.replace(/^[.-]+/, "").replace(/[.-]+$/, "");
  return trimmed.slice(0, FILENAME.maxSuffixLength);
}

function filenameFor(value) {
  const suffix = sanitizeForFilename(value);
  if (suffix === "") {
    return `${FILENAME.prefix}.png`;
  }
  return `${FILENAME.prefix}-${suffix}.png`;
}

async function downloadPng() {
  const canvas = document.createElement("canvas");
  const ctx = createContext(canvas, POSTER.width, POSTER.height);
  drawPoster(ctx, state.value);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (blob === null) {
    throw new Error("the browser could not encode a PNG");
  }

  const url = URL.createObjectURL(blob);
  if (previousExportUrl !== null) {
    URL.revokeObjectURL(previousExportUrl);
  }
  previousExportUrl = url;

  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFor(state.value);
  document.body.append(link);
  link.click();
  link.remove();
  return link.download;
}

// -----------------------------------------------------------------------------
// Controls
// -----------------------------------------------------------------------------

function setStatus(message, tone) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.dataset.tone = tone ?? "";
}

// The '#' is part of the design, so a pasted one is dropped rather than rendered a
// second time as '##13'. A pasted value is also clipped to the field's own limit, so the
// drawn number and the field can never disagree about what was typed.
function normalizeValue(raw) {
  return raw.replace(/^#+\s*/, "").slice(0, MAX_DIGITS);
}

function wireControls() {
  const input = document.getElementById("issue");
  const downloadButton = document.getElementById("download");

  // Set from the constant rather than repeated as a literal in index.html.
  input.maxLength = MAX_DIGITS;
  input.value = state.value;
  input.addEventListener("input", () => {
    const normalized = normalizeValue(input.value);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    // The field keeps surrounding whitespace as typed, but the drawn label and the
    // filename both use the trimmed value.
    state.value = normalized.trim();
    requestRender();
  });

  downloadButton.addEventListener("click", async () => {
    downloadButton.disabled = true;
    try {
      setStatus(`Saved ${await downloadPng()}`, "ok");
    } catch (error) {
      setStatus(`Could not create the PNG (${error.message}).`, "error");
    } finally {
      downloadButton.disabled = false;
    }
  });
}

// The number is rasterised text, so the export must not run before the display font
// is available. Failures are swallowed: without a network the page still works, it
// just falls back down the font stack.
async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load(`400 200px '${FONT_FAMILY}'`),
      document.fonts.ready,
    ]);
  } catch (error) {
    return;
  }
}

// -----------------------------------------------------------------------------
// Start-up
// -----------------------------------------------------------------------------

async function init() {
  wireControls();

  const stage = document.getElementById("stage");
  const downloadButton = document.getElementById("download");
  new ResizeObserver(requestRender).observe(stage);
  // ResizeObserver does not fire when only the device pixel ratio changes.
  window.addEventListener("resize", requestRender);

  try {
    await loadLogo();
  } catch (error) {
    updatePreview();
    setStatus(describeLogoFailure(error), "error");
    return;
  }

  updatePreview();
  await waitForFonts();
  updatePreview();
  downloadButton.disabled = false;
  setStatus("");
}

init();
