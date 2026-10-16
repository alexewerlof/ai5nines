# ai5nines assets

Brand artwork for the ai5nines newsletter, plus the internal tool that turns it into
ready-to-post images.

Published as a GitHub Pages site on <https://assets.ai5nines.com>.

## Contents

| Path                                   | Purpose                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `index.html`                           | The page: markup and links only. No styles or script inline.                     |
| `styles.css`                           | Page styling.                                                                    |
| `app.js`                               | Page behaviour: the issue-number field, the download button, sizing the preview. |
| `poster.js`                            | The design: poster layout, canvas surfaces, and loading `ai5nines.svg`.          |
| `ai5nines.svg`                         | Brand artwork. The single source of truth for the logo.                          |
| `ai5nines-512.png`, `ai5nines-128.png` | Raster copies. `128` is used as the page favicon.                                |
| `CNAME`                                | Tells GitHub Pages to serve this site at `assets.ai5nines.com`.                  |
| `.nojekyll`                            | Stops Pages from running Jekyll over the published files.                        |

## The Assets tool

Open the page, type an issue number, download the PNG. The export is written at
exactly 1200×630 and named `ai5nines-issue-<number>.png`.

The field takes up to three digits. The number is drawn very large, so the design is
tuned for the short issues the newsletter actually has rather than for long values.

1200×630 is the social/post preview size Substack recommends, and the ratio its
preview frames actually crop to. Substack's help centre also calls preview images
14:10, but that figure is wrong — 1200×630 is 40:21 — and an export built to 14:10
gets cropped when it is uploaded.

The tool must be served over HTTP. Opening `index.html` straight from disk fails,
because browsers block `fetch()` of `ai5nines.svg` from a `file://` URL.

### Local use

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

### Editing the design

Everything about how the poster looks lives at the top of `poster.js`: the `POSTER`
size, `COLORS`, `LABEL`, and the `DESIGN` block holding the margin, logo size and
spacing. `drawPoster()` itself is short and reads as the layout.

Two rules keep the design honest:

- **One drawing path.** `drawPoster()` renders both the on-screen preview and the
  export, onto surfaces of different pixel sizes. Never add a separate preview- or
  export-only drawing path, or the two will drift apart.
- **Fixed poster space.** The design is authored in a 1200×630 space and scaled to
  fit the target surface, so every measurement is in the same units. Only the export
  surface is ever exactly 1200×630.

### Why the logo is preloaded

`index.html` preloads `ai5nines.svg` with `as="fetch" crossorigin`. Both parts matter,
because the artwork is read as _text_ by `fetch()` in `poster.js` rather than drawn
straight from an `<img>`:

- `as="image"` would prime a different cache entry and cost a **second** download.
- Dropping `crossorigin` produces a request whose credentials mode does not match the
  `fetch()`, so the browser downloads the file twice and logs a warning.

If the way `poster.js` loads the artwork ever changes, change the preload to match —
otherwise it silently stops helping.

## Publishing

1. Push to the branch configured under _Settings → Pages_.
2. DNS: a `CNAME` record for `assets` pointing at `<owner>.github.io`. It must be
   DNS-only — a Cloudflare-style orange-cloud proxy in front of it breaks the
   certificate.
3. In _Settings → Pages_, set the custom domain to `assets.ai5nines.com` and enable
   **Enforce HTTPS**.

Note that GitHub Pages on a **private** repository needs a paid plan (Pro, Team or
Enterprise).
