// The Assets page: the issue-number field, the download and copy buttons, the status line, and
// starting everything up. The design lives in poster.js, the page's canvases in preview.js and
// the exporting in export.js; this module is only the wiring between them.

import { FONT, ISSUE, ISSUE_MAX_DIGITS, LABEL } from "./config.js";
import { canCopyImage, copyPng, downloadPng } from "./export.js";
import { describeLogoFailure, loadLogo } from "./logo.js";
import { mountCropPreviews, observeStageSize, render } from "./preview.js";

// The issue number currently on screen, and the value the export is named after.
let value = ISSUE.defaultValue;

// -----------------------------------------------------------------------------
// Status
// -----------------------------------------------------------------------------

function setStatus(message, tone) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.dataset.tone = tone ?? "";
}

// -----------------------------------------------------------------------------
// The issue-number field
// -----------------------------------------------------------------------------

// The browser keeps letters out of a number field, but it still lets through the sign, the
// decimal point and the exponent that make up a JavaScript number, and the mark is only ever
// digits. Keeping the digits alone also clips the value to the field's own limit, so the drawn
// number and the field can never disagree about what was typed.
function normalizeValue(raw) {
  return raw.replace(/\D/g, "").slice(0, ISSUE_MAX_DIGITS);
}

function wireIssueField() {
  const input = document.getElementById("issue");
  // Set from the constants rather than repeated as literals in index.html. A number field
  // ignores `maxlength`, so the digit limit is enforced on every input instead.
  input.min = ISSUE.min;
  input.max = ISSUE.max;
  input.value = value;
  input.addEventListener("input", () => {
    const normalized = normalizeValue(input.value);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    value = normalized;
    render(value);
  });
}

// -----------------------------------------------------------------------------
// The buttons
// -----------------------------------------------------------------------------

// Both buttons hand the same poster to the browser and differ only in the hand-off, so they
// are framed the same way: disabled while the work runs, one status line that either says what
// happened or says what went wrong.

function wireDownloadButton(button) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      setStatus(`Saved ${await downloadPng(value)}`, "ok");
    } catch (error) {
      setStatus(`Could not create the PNG (${error.message}).`, "error");
    } finally {
      button.disabled = false;
    }
  });
}

function wireCopyButton(button) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await copyPng(value);
      setStatus(`Copied ${LABEL.hash}${value} to the clipboard.`, "ok");
    } catch (error) {
      setStatus(`Could not copy the image (${error.message}).`, "error");
    } finally {
      button.disabled = false;
    }
  });
}

// -----------------------------------------------------------------------------
// Start-up
// -----------------------------------------------------------------------------

// The number is rasterised text, so the export must not run before the display font is
// available. Failures are swallowed: without a network the page still works, it just falls
// back down the font stack.
async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load(`${FONT.load} '${FONT.family}'`),
      document.fonts.ready,
    ]);
  } catch (error) {
    return;
  }
}

async function init() {
  const downloadButton = document.getElementById("download");
  const copyButton = document.getElementById("copy");

  // Copying needs the async clipboard API, which not every browser has; where it is missing the
  // button is left off the page rather than offered and then failing when pressed.
  const canCopy = canCopyImage();
  if (canCopy) {
    wireCopyButton(copyButton);
  } else {
    copyButton.hidden = true;
  }

  wireIssueField();
  wireDownloadButton(downloadButton);
  mountCropPreviews();
  observeStageSize();

  try {
    await loadLogo();
  } catch (error) {
    render(value);
    setStatus(describeLogoFailure(error), "error");
    return;
  }

  render(value);
  await waitForFonts();
  render(value);
  downloadButton.disabled = false;
  copyButton.disabled = false;
  setStatus("");
}

init();
