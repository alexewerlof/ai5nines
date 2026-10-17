// The on-page preview: the poster at the stage's width, plus one small frame per crop
// Substack will cut the poster into.

import { CROPS, LABEL, POSTER, PREVIEW } from './config.js'
import { drawPoster } from './poster.js'
import { createCropContext, createPosterContext } from './surfaces.js'

// One entry per Substack crop frame, filled in by mountCropPreviews().
const cropFrames = []

// The value on screen, so a resize can redraw without the page having to hand it back.
let shownValue = null

function formatRatio(ratio) {
	return `${Number(ratio.toFixed(2))}:1`
}

function updatePreview(value) {
	const stage = document.getElementById('stage')
	const canvas = document.getElementById('poster')
	const cssWidth = stage.clientWidth
	const dpr = window.devicePixelRatio || 1
	const pixelWidth = Math.max(1, Math.round(cssWidth * dpr))
	const pixelHeight = Math.max(1, Math.round((pixelWidth * POSTER.height) / POSTER.width))

	const ctx = createPosterContext(canvas, pixelWidth, pixelHeight)
	drawPoster(ctx, value)
	canvas.setAttribute('aria-label', `Poster preview: logo with ${LABEL.hash}${value}`)
}

// Substack crops the one uploaded image into a different frame for each placement, so the
// only way to know a change survives is to look at every frame the poster lands in.
function updateCrops(value) {
	for (const { canvas, crop } of cropFrames) {
		const pixelWidth = Math.max(1, Math.round(PREVIEW.cropPixelHeight * crop.ratio))
		const ctx = createCropContext(canvas, pixelWidth, PREVIEW.cropPixelHeight)
		drawPoster(ctx, value)
	}
}

// Mounts one canvas per frame Substack will crop the poster into. The list comes from CROPS,
// so the row cannot drift out of step with the ratios the design is safe for.
export function mountCropPreviews() {
	const row = document.getElementById('crops')
	for (const crop of CROPS) {
		const figure = document.createElement('figure')
		figure.className = 'crop'

		const canvas = document.createElement('canvas')
		canvas.className = 'crop__canvas'
		canvas.setAttribute('role', 'img')
		canvas.setAttribute('aria-label', `${crop.label} crop preview`)

		const caption = document.createElement('figcaption')
		caption.className = 'crop__label'
		caption.textContent = `${crop.label} (${formatRatio(crop.ratio)})`

		figure.append(canvas, caption)
		row.append(figure)
		cropFrames.push({ canvas, crop })
	}
}

// The poster and its crops are two views of one design, so they are always redrawn together
// and can never show different values.
export function render(value) {
	shownValue = value
	updatePreview(value)
	updateCrops(value)
}

let redrawQueued = false

// The stage's width decides the preview's resolution, so a resize has to redraw it. Coalesced
// to one frame, because the observer fires for every intermediate size while the window is
// dragged. Does nothing until the first render, so a resize during start-up cannot draw with
// no value.
function scheduleRedraw() {
	if (redrawQueued) {
		return
	}
	redrawQueued = true
	requestAnimationFrame(() => {
		redrawQueued = false
		if (shownValue !== null) {
			render(shownValue)
		}
	})
}

export function observeStageSize() {
	new ResizeObserver(scheduleRedraw).observe(document.getElementById('stage'))
	// ResizeObserver does not fire when only the device pixel ratio changes.
	window.addEventListener('resize', scheduleRedraw)
}
