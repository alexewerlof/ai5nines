// The '#N' mark: measuring it in the real font, fitting it into the room it has, and drawing
// it centred on its own ink.

import { FONT_STACK, LABEL } from "./config.js";

// measureLabel sets ctx.font as a side effect: canvas measurement is only meaningful for the
// font that will actually be used to draw.
export function measureLabel(ctx, value, size) {
  ctx.font = `${size}px ${FONT_STACK}`;
  const whole = ctx.measureText(LABEL.hash + value);
  // The ink box, as offsets from the text origin. `actualBoundingBoxLeft` is positive when
  // the ink reaches to the LEFT of the origin and negative when it starts to the right of
  // it, and Aldrich's '#' sits well to the right of its origin, so it comes back negative.
  // The near edge is therefore `-left`, and the width is the distance between the two
  // edges — not the difference of the raw metrics, which double-counts the bearing.
  const inkStart = -whole.actualBoundingBoxLeft;
  const inkEnd = whole.actualBoundingBoxRight;
  return {
    hashWidth: ctx.measureText(LABEL.hash).width,
    inkStart,
    inkWidth: inkEnd - inkStart,
    ascent: whole.actualBoundingBoxAscent,
    descent: whole.actualBoundingBoxDescent,
  };
}

// Shrink the label until it fits the room it has, so a long value still ends up whole after a
// crop. Starts from the exact ratio, then steps down to absorb the small non-linearity of
// glyph metrics.
export function fitLabelSize(ctx, value, maxWidth, maxSize) {
  let size = maxSize;
  const measured = measureLabel(ctx, value, size);
  if (measured.inkWidth > maxWidth) {
    size = Math.floor(size * (maxWidth / measured.inkWidth));
  }
  while (
    size > LABEL.minSize &&
    measureLabel(ctx, value, size).inkWidth > maxWidth
  ) {
    size -= 1;
  }
  return size;
}

// Centred on its own ink, so the '#' and the digits read as one balanced mark whatever the
// number's length.
export function drawLabel(ctx, value, options) {
  const { centerX, centerY, size } = options;
  const metrics = measureLabel(ctx, value, size);
  // `left` is the text origin, so the ink lands centred on centerX once the origin is
  // stepped back by the ink's own leading bearing.
  const left = centerX - metrics.inkStart - metrics.inkWidth / 2;
  const baseline = centerY + (metrics.ascent - metrics.descent) / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = LABEL.hashColor;
  ctx.fillText(LABEL.hash, left, baseline);
  ctx.fillStyle = LABEL.valueColor;
  ctx.fillText(value, left + metrics.hashWidth, baseline);
}
