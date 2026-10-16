// Draws the ai5nines poster onto a 2d canvas.
//
// This module owns the design and the logo, and deliberately touches no DOM API
// other than fetching the artwork: it takes a context and a value, and paints. The
// page behaviour around it lives in app.js.

// 1200 x 630 is the social/post preview size Substack recommends, and the ratio its
// preview frames actually crop to. Their help centre also calls preview images 14:10,
// but that figure is wrong: 1200 x 630 is 40:21, and a 14:10 export gets cropped. The
// design below is authored in this space.
export const POSTER = { width: 1200, height: 630 };

const COLORS = {
  background: "#ffffff",
  ink: "#333333",
  accent: "#ff0000",
};

const LOGO = {
  src: "ai5nines.svg",
  viewBox: 512,
  // The ink bounds of the artwork inside the 0 0 512 512 viewBox, measured from the
  // path data. The artwork does not fill its viewBox, so cropping to these bounds is
  // what lets the design talk about the logo's real size.
  content: { x: 42.876, y: 79.341, width: 413.372, height: 360.249 },
  // Rasterise the SVG at twice its viewBox so the logo stays crisp when scaled up.
  raster: 1024,
};

export const LABEL = {
  hash: "#",
  // The number carries the brand red, matching the red '5' in the wordmark.
  hashColor: COLORS.ink,
  valueColor: COLORS.accent,
  minSize: 16,
};

// The design, in poster units. Every position and size the poster uses lives here,
// so tuning the look is a matter of editing these numbers.
const DESIGN = {
  // Distance from the poster edge to the logo and to the number. The logo sits at it
  // on both axes, the number ends at it on the right and the bottom.
  margin: 48,
  logoWidth: 272,
  // How far short of the logo's column a long number stops growing. The two blocks are
  // stacked, so this is about crowding rather than collision.
  gap: 60,
  // The tallest the number is ever drawn, and so the size it is drawn at for any issue
  // short enough not to be shrunk by the fit below. The number grows upward from the
  // bottom margin, so this is what keeps it clear of the logo above it.
  maxLabelSize: 403,
};

// Aldrich is a free squared-off face with flat terminals, the closest match to the
// geometry of the ai5nines wordmark.
export const FONT_FAMILY = "Aldrich";
const FONT_STACK = `'${FONT_FAMILY}', 'Helvetica Neue', Arial, sans-serif`;

// -----------------------------------------------------------------------------
// Geometry
// -----------------------------------------------------------------------------

const LOGO_ASPECT = LOGO.content.width / LOGO.content.height;

function logoSize(width) {
  return { width, height: width / LOGO_ASPECT };
}

// measureLabel sets ctx.font as a side effect: canvas measurement is only meaningful
// for the font that will actually be used to draw.
function measureLabel(ctx, value, size) {
  ctx.font = `${size}px ${FONT_STACK}`;
  const hashWidth = ctx.measureText(LABEL.hash).width;
  const valueWidth = value === "" ? 0 : ctx.measureText(value).width;
  const whole = ctx.measureText(LABEL.hash + value);
  return {
    width: hashWidth + valueWidth,
    hashWidth,
    // The digits sit inside their advance width with a little space to the right of
    // the ink, so a label aligned by `width` looks inset from the margin by that
    // bearing — visibly so at this size. Positioning by the ink instead is what makes
    // the number's outer edge line up with the logo's, which is cropped to its ink.
    inkRight: whole.actualBoundingBoxRight,
    ascent: whole.actualBoundingBoxAscent,
    descent: whole.actualBoundingBoxDescent,
  };
}

// Shrink the label until it fits, so a long value never spills out of its layout box.
// Starts from the exact ratio, then steps down to absorb the small non-linearity of
// glyph metrics.
function fitLabelSize(ctx, value, maxWidth, maxSize) {
  let size = maxSize;
  const measured = measureLabel(ctx, value, size);
  if (measured.width > maxWidth) {
    size = Math.floor(size * (maxWidth / measured.width));
  }
  while (
    size > LABEL.minSize &&
    measureLabel(ctx, value, size).width > maxWidth
  ) {
    size -= 1;
  }
  return size;
}

// -----------------------------------------------------------------------------
// Drawing
// -----------------------------------------------------------------------------

function drawLogo(ctx, rect) {
  if (logoImage === null) {
    return;
  }
  const sourceScale = LOGO.raster / LOGO.viewBox;
  const source = LOGO.content;
  ctx.drawImage(
    logoImage,
    source.x * sourceScale,
    source.y * sourceScale,
    source.width * sourceScale,
    source.height * sourceScale,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
}

// The label is always flush against a right edge, so it grows leftward as the number
// gets longer.
function drawLabel(ctx, value, options) {
  const { right, centerY, size } = options;
  const metrics = measureLabel(ctx, value, size);
  const left = right - metrics.inkRight;
  const baseline = centerY + (metrics.ascent - metrics.descent) / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = LABEL.hashColor;
  ctx.fillText(LABEL.hash, left, baseline);
  ctx.fillStyle = LABEL.valueColor;
  ctx.fillText(value, left + metrics.hashWidth, baseline);
}

// The design: the wordmark in the top left, the issue number large in the bottom
// right. Both are placed from the same margin, so the two outer edges line up.
export function drawPoster(ctx, value) {
  const logo = logoSize(DESIGN.logoWidth);
  const labelRight = POSTER.width - DESIGN.margin;
  const maxWidth = labelRight - (DESIGN.margin + DESIGN.gap);
  const size = fitLabelSize(ctx, value, maxWidth, DESIGN.maxLabelSize);
  const label = measureLabel(ctx, value, size);
  const labelHeight = label.ascent + label.descent;

  drawLogo(ctx, {
    x: DESIGN.margin,
    y: DESIGN.margin,
    width: logo.width,
    height: logo.height,
  });
  drawLabel(ctx, value, {
    right: labelRight,
    centerY: POSTER.height - DESIGN.margin - labelHeight / 2,
    size,
  });
}

// -----------------------------------------------------------------------------
// Surfaces
// -----------------------------------------------------------------------------

// The design is authored in the fixed POSTER coordinate space and scaled to whatever
// surface needs it. The preview and the export therefore run through the very same
// drawing code and can never disagree about the design.
export function createContext(canvas, width, height) {
  if (canvas.width !== width) {
    canvas.width = width;
  }
  if (canvas.height !== height) {
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  // Paint the whole surface, not just the scaled poster rect, so rounding can never
  // leave a transparent sliver along an edge of the export.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / POSTER.width, height / POSTER.height);
  ctx.setTransform(
    scale,
    0,
    0,
    scale,
    (width - POSTER.width * scale) / 2,
    (height - POSTER.height * scale) / 2,
  );
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

// -----------------------------------------------------------------------------
// Logo
// -----------------------------------------------------------------------------

let logoImage = null;

// The artwork is fetched as text so its root can be given an explicit raster size: an
// SVG with only a viewBox has no reliable intrinsic size and would otherwise be
// rasterised too small to upscale cleanly. The tracked file on disk is never modified.
function normalizeSvg(text) {
  const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
  if (parsed.querySelector("parsererror") !== null) {
    throw new Error("the file is not valid SVG");
  }
  const svg = parsed.documentElement;
  svg.setAttribute("width", String(LOGO.raster));
  svg.setAttribute("height", String(LOGO.raster));

  // Drop editor-only elements (Boxy SVG export metadata).
  const svgNamespace = "http://www.w3.org/2000/svg";
  for (const element of Array.from(svg.querySelectorAll("*"))) {
    if (element.namespaceURI !== svgNamespace) {
      element.remove();
    }
  }
  return new XMLSerializer().serializeToString(svg);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("the file could not be decoded"));
    image.src = url;
  });
}

export async function loadLogo() {
  const response = await fetch(LOGO.src);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const svg = normalizeSvg(await response.text());
  // A blob URL inherits this page's origin, so the canvas stays untainted and the
  // export keeps working. The URL is deliberately kept alive for the life of the
  // page rather than revoked, so the decoded image is never discarded.
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  logoImage = await loadImage(url);
}

export function describeLogoFailure(error) {
  if (location.protocol === "file:") {
    return "Open this page over http:// — browsers refuse to load ai5nines.svg from a file:// URL.";
  }
  return `Could not load ${LOGO.src} (${error.message}). The poster needs it.`;
}
