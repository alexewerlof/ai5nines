// The design: where the wordmark and the issue number sit on the poster. This module owns
// the layout maths and nothing else, so drawPoster() below is the whole design.
//
// Its parts live in their own modules - the artwork in logo.js, the '#N' mark in label.js,
// the drawing surfaces in surfaces.js - and every number it uses comes from config.js.

import { DESIGN, POSTER, SAFE_WIDTH } from "./config.js";
import { drawLabel, fitLabelSize, measureLabel } from "./label.js";
import { drawLogo, logoSize } from "./logo.js";

// The design: the wordmark above the issue number, the two centred across the poster and
// centred together down it, with a fixed space between them.
//
// Centring across is the whole crop strategy - a frame narrower than the poster can only ever
// remove poster that is already empty, so the lockup survives every frame in CROPS.
//
// Down the poster the pair is centred as one block. The gap between the wordmark and the number
// is the fixed spacing and the padding at the top and bottom is whatever is left over, which is
// the deliberate trade: the number is width-bound, so a longer value is drawn smaller and is
// shorter, and that height comes out of the padding rather than out of the gap. See DESIGN.gap.
export function drawPoster(ctx, value) {
  const logo = logoSize(DESIGN.logoWidth);
  const maxLabelWidth = SAFE_WIDTH - DESIGN.safeInset * 2;
  const size = fitLabelSize(ctx, value, maxLabelWidth, DESIGN.maxLabelSize);
  const label = measureLabel(ctx, value, size);
  const labelHeight = label.ascent + label.descent;

  const centerX = POSTER.width / 2;
  const blockHeight = logo.height + DESIGN.gap + labelHeight;
  const top = (POSTER.height - blockHeight) / 2;

  drawLogo(ctx, {
    x: centerX - logo.width / 2,
    y: top,
    width: logo.width,
    height: logo.height,
  });
  drawLabel(ctx, value, {
    centerX,
    centerY: top + logo.height + DESIGN.gap + labelHeight / 2,
    size,
  });
}
