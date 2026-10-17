// The export: rasterising the poster at its exact export size, then handing it to the browser —
// as a downloaded file, or as an image on the clipboard to paste into a post.

import { EXPORT, POSTER } from "./config.js";
import { drawPoster } from "./poster.js";
import { createPosterContext } from "./surfaces.js";

const PNG_MIME = "image/png";

// The '#' is part of the design, so a pasted one is dropped rather than saved into the name.
function sanitizeForFilename(value) {
  const withoutHashes = value.trim().replace(/^#+/, "");
  const withoutIllegal = withoutHashes.replace(EXPORT.illegalInFilename, "");
  const collapsed = withoutIllegal.replace(/\s+/g, "-");
  const trimmed = collapsed.replace(/^[.-]+/, "").replace(/[.-]+$/, "");
  return trimmed.slice(0, EXPORT.maxSuffixLength);
}

function filenameFor(value) {
  const suffix = sanitizeForFilename(value);
  if (suffix === "") {
    return `${EXPORT.prefix}.${EXPORT.extension}`;
  }
  return `${EXPORT.prefix}-${suffix}.${EXPORT.extension}`;
}

// The raster: the poster drawn at its exact export size and encoded to a PNG. Downloading and
// copying are two ways of handing out these same bytes, so they share this rather than each
// rastering the poster their own way.
async function renderPngBlob(value) {
  const canvas = document.createElement("canvas");
  const ctx = createPosterContext(canvas, POSTER.width, POSTER.height);
  drawPoster(ctx, value);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, PNG_MIME));
  if (blob === null) {
    throw new Error("the browser could not encode a PNG");
  }
  return blob;
}

// Only one export URL is ever meant to be alive, so the previous one is revoked rather than
// left to pile up.
let previousUrl = null;

export async function downloadPng(value) {
  const blob = await renderPngBlob(value);

  const url = URL.createObjectURL(blob);
  if (previousUrl !== null) {
    URL.revokeObjectURL(previousUrl);
  }
  previousUrl = url;

  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFor(value);
  document.body.append(link);
  link.click();
  link.remove();
  return link.download;
}

// Putting an image on the clipboard needs a secure context and both halves of the async
// clipboard API. The tool is only ever served over https or from localhost, so this is normally
// true — but the page asks rather than assumes, so a browser that cannot copy is not offered a
// button that would only fail when pressed.
export function canCopyImage() {
  return (
    typeof ClipboardItem === "function" &&
    typeof navigator.clipboard?.write === "function"
  );
}

// The copy: the same PNG, put on the clipboard so it can be pasted straight into a post instead
// of being saved to disk and uploaded again.
export async function copyPng(value) {
  if (!canCopyImage()) {
    throw new Error("this browser cannot put an image on the clipboard");
  }
  // The raster is asynchronous, so the item is handed the promise rather than a finished blob.
  // That keeps the write itself in the same task as the click that asked for it, which is the
  // user gesture the browser wants to see.
  await navigator.clipboard.write([
    new ClipboardItem({ [PNG_MIME]: renderPngBlob(value) }),
  ]);
}
