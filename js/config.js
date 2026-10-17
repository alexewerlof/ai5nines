// Every number the poster and the page are tuned with, so a change is made in one place
// rather than hunted for across the modules. Nothing here decides anything: the modules
// read these values, and the derived ones at the bottom are the only arithmetic allowed.

// -----------------------------------------------------------------------------
// The poster and the frames it is cropped into
// -----------------------------------------------------------------------------

// 1200 x 630 is the size Substack recommends for a post's preview image, and the ratio its
// email and social previews show. It is NOT the ratio of the post thumbnails: Substack
// crops the one uploaded image into several different frames, and this newsletter's home
// page uses the 'newspaper' layout. Their help centre also calls preview images 14:10, but
// that figure is wrong — 1200 x 630 is 40:21 — and an export built to 14:10 is cropped.
export const POSTER = { width: 1200, height: 630 };

// The frames Substack crops the poster into, narrowest first. The ratios are the sizes
// Substack documents for each placement. The narrowest one fixes the safe area the lockup
// is laid out in (see SAFE_WIDTH), so removing a crop here widens the design's room.
export const CROPS = [
  { label: "Square thumbnail", ratio: 66 / 66 },
  { label: "List thumbnail", ratio: 162 / 120 },
  { label: "Lead image", ratio: 626 / 418 },
  { label: "Email and social", ratio: POSTER.width / POSTER.height },
];

// -----------------------------------------------------------------------------
// Colours and the issue mark
// -----------------------------------------------------------------------------

// The two brand colours, taken from the wordmark: `ink` is the dark 'ai', `accent` is the
// red '5'.
export const COLORS = {
  background: "#ffffff",
  ink: "#333333",
  accent: "#ff0000",
};

// The '#' is red like the wordmark's '5' and the number is ink like its 'ai', so the two
// halves of the mark are coloured the same way round as the logo they sit under.
export const LABEL = {
  hash: "#",
  hashColor: COLORS.accent,
  valueColor: COLORS.ink,
  minSize: 16,
};

// -----------------------------------------------------------------------------
// The artwork
// -----------------------------------------------------------------------------

// The artwork the page reads at runtime. `content` is the ink bounds inside the 0 0 512 512
// viewBox, measured from the path data: the artwork does not fill its viewBox, so cropping
// to these bounds is what lets the design talk about the logo's real size.
export const LOGO = {
  // Resolved against the page, so this and the preload href in index.html must match.
  src: "img/ai5nines.svg",
  viewBox: 512,
  content: { x: 42.876, y: 79.341, width: 413.372, height: 360.249 },
  // Rasterise the SVG at twice its viewBox so the logo stays crisp when scaled up.
  raster: 1024,
};

// -----------------------------------------------------------------------------
// The design, in poster units
// -----------------------------------------------------------------------------

// Every position and size the poster uses, so tuning the look is a matter of editing these
// numbers.
export const DESIGN = {
  // Space kept between the safe area's edge and the number's ink, so a crop never cuts
  // flush against it. This is the dial that decides how big the number gets: the number
  // always runs out of width before it runs out of height, so a smaller inset is a bigger
  // number.
  safeInset: 16,
  // The wordmark. Deliberately much smaller than the number, so the two do not compete.
  logoWidth: 204,
  // Space between the wordmark and the number, which together read as one lockup.
  //
  // This is the spacing held FIXED; the padding at the poster's top and bottom is left to
  // vary. Only one of the two can be fixed, because the number is width-bound: a longer
  // value is drawn smaller and is therefore shorter, so a longer value makes a shorter
  // lockup and that difference has to go somewhere. Holding this gap steady keeps the pair
  // reading as one unit and stops the number drifting away from the wordmark; fixing the
  // edges instead pins the padding but lets the two pull apart, which is what a one-digit
  // and a two-digit cover looked like next to each other in a list.
  gap: 60,
  // The tallest the number is ever drawn. The safe area's width normally binds first and
  // this never applies; it is the backstop for the vertical fit, which only came into play
  // if CROPS were narrowed enough to widen the safe area a long way.
  maxLabelSize: 470,
};

// -----------------------------------------------------------------------------
// Type
// -----------------------------------------------------------------------------

// Aldrich is a free squared-off face with flat terminals, the closest match to the geometry
// of the ai5nines wordmark.
export const FONT = {
  family: "Aldrich",
  // The weight and size the page waits for before drawing: the number is rasterised text,
  // so the real face has to be loaded or the export would use a fallback.
  load: "400 200px",
};

// -----------------------------------------------------------------------------
// The page: the field, the download and the crop row
// -----------------------------------------------------------------------------

export const ISSUE = {
  defaultValue: "13",
  // The number is drawn very large, so the design is tuned for the two- and three-digit
  // issues the newsletter has. The field is capped rather than letting a stray long value
  // shrink the number to a size nothing was designed for.
  min: 1,
  max: 999,
};

export const EXPORT = {
  prefix: "ai5nines-issue",
  extension: "png",
  maxSuffixLength: 64,
  illegalInFilename: /[\\/:*?"<>|\u0000-\u001f\u007f]/g,
};

export const PREVIEW = {
  // Each crop preview is drawn at twice the height the stylesheet displays it at, so the
  // row stays crisp on a high-density display. This is the drawing resolution; the height
  // in the stylesheet is the layout.
  cropPixelHeight: 264,
};

// -----------------------------------------------------------------------------
// Derived
// -----------------------------------------------------------------------------

export const FONT_STACK = `'${FONT.family}', 'Helvetica Neue', Arial, sans-serif`;

// The safe area: the width that survives the narrowest crop. Every frame is narrower than
// the poster, so a crop keeps the full height and only the sides are ever at risk. Keeping
// the whole design inside this width, centred, leaves a crop nothing to remove but empty
// poster.
export const SAFE_WIDTH =
  POSTER.height * Math.min(...CROPS.map((crop) => crop.ratio));

// A number field caps by range, not by length, so the digits the field may hold are read back
// off the range it is given rather than kept as a second literal next to it.
export const ISSUE_MAX_DIGITS = String(ISSUE.max).length;
