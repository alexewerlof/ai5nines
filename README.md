# ai5nines assets

Brand artwork for the [ai5nines](https://ai5nines.com) newsletter, and the small tool that
turns it into ready-to-post issue images.

Published at <https://assets.ai5nines.com>.

## The tool

Open the page, type an issue number, then download the PNG — or copy it and paste it
straight into a post.

- The export is exactly **1200×630** and is named `ai5nines-issue-<number>.png`.
- **Copy image** puts that same picture on the clipboard, so a post can be filled without
  saving a file first.
- The field takes a number from **1 to 999**.
- The number is set very large, so the design is tuned for the short issue numbers the
  newsletter actually has rather than for long values.

## What the image looks like

The wordmark sits above the issue number. Both are centred, with a generous amount of
empty space around them.

That empty space is deliberate, and it is what makes the image work. Substack does not
show an uploaded picture as it is — it crops it to a different shape for every placement
the image appears in, and the narrowest of those is a small square thumbnail that keeps
only the middle 630 of the image's 1200 units. Putting the mark in the centre, and
keeping it small enough to fit inside that square, means no placement can cut it.

The **Crops** row on the page shows the image in each of those shapes at once. If the
mark is whole in the narrowest frame there it is whole everywhere, so the row doubles as
a preview of what Substack will show and as the quickest way to see that a change has
not broken one of the smaller frames.

## Files

| Path                       | What it is                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| `index.html`, `styles.css` | The page itself.                                                     |
| `js/`                      | The tool's code, one small module per job.                           |
| `img/`                     | The brand artwork, including `ai5nines.svg`, the source of the logo. |

If you are working on the tool, [`AGENTS.md`](AGENTS.md) covers how it is put together,
where the design constants live, and how to check a change.
