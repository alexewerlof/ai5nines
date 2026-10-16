# Agent notes

Static site, no build step, no package manager, no test suite. Everything shipped here
is served exactly as it sits on disk, so a change is live the moment it is saved.

- **`README.md` is the source of truth** for what this repo contains, how the Assets
  tool is structured, and the rules that keep the preview and the export in agreement.
  Read it before changing the tool.
- **The tool is four files with one job each**: `index.html` (markup), `styles.css`,
  `app.js` (page behaviour), `poster.js` (the design). Keep the boundaries: `poster.js`
  must not reach for page elements, and no styling or script belongs back in the HTML.
- **`ai5nines.svg` is brand artwork, not a build input.** The page reads it at runtime.
  Never rewrite it from inside the tool, and never edit it to make a layout work —
  adjust the `DESIGN` constants in `poster.js` instead.
- **The preload in `index.html` is coupled to `poster.js`.** It only helps while it
  matches how the artwork is actually fetched. See the README before touching either.

## Code style

- Tabs for indentation.
- Single quotes.
- No semicolons.
- Named constants instead of repeated literals and magic numbers.

## Verifying a change

The page cannot be opened from disk — browsers block `fetch()` of the SVG over
`file://`. Live Server serves this repo on port 5500; otherwise:

```
python3 -m http.server 8000
```

Then load <http://localhost:8000/> and confirm the preview draws, then check that a
download is exactly 1200×630. ImageMagick is not installed here, so read the size
straight out of the PNG header instead:

```
python3 -c "import struct,sys; d=open(sys.argv[1],'rb').read(24); print('%dx%d' % struct.unpack('>II', d[16:24]))" ai5nines-issue-13.png
```

The page holds a live-reload websocket under Live Server, so a browser automation wait
on `networkidle` never resolves against port 5500 — wait on `load` instead.

The tool is intentionally excluded from search engines via a `noindex` meta tag while
it is hosted on a public Pages site.
