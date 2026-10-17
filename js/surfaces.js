// Canvas plumbing: hands back a context that draws in poster units whatever pixel size the
// surface actually is. Nothing here knows what the poster looks like.

import { COLORS, POSTER } from './config.js'

// The design is authored in the fixed POSTER coordinate space and scaled to whatever surface
// needs it. The preview, the export and the crop previews therefore all run through this one
// path and can never disagree about the design; only the surface, and so the scale, differs.
function createSurfaceContext(canvas, width, height, fit) {
	if (canvas.width !== width) {
		canvas.width = width
	}
	if (canvas.height !== height) {
		canvas.height = height
	}
	const ctx = canvas.getContext('2d')
	// Paint the whole surface, not just the scaled poster rect, so rounding can never leave a
	// transparent sliver along an edge of the export.
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.fillStyle = COLORS.background
	ctx.fillRect(0, 0, width, height)

	// 'contain' fits the whole poster in, 'cover' fills the surface and lets the overflow
	// fall outside it, which is what a crop frame does.
	const widthScale = width / POSTER.width
	const heightScale = height / POSTER.height
	const scale =
		fit === 'cover'
			? Math.max(widthScale, heightScale)
			: Math.min(widthScale, heightScale)
	ctx.setTransform(
		scale,
		0,
		0,
		scale,
		(width - POSTER.width * scale) / 2,
		(height - POSTER.height * scale) / 2,
	)
	ctx.imageSmoothingEnabled = true
	ctx.imageSmoothingQuality = 'high'
	return ctx
}

// A surface that shows the whole poster.
export function createPosterContext(canvas, width, height) {
	return createSurfaceContext(canvas, width, height, 'contain')
}

// A surface for one of Substack's crop frames: the same poster, drawn by the same code, but
// framed the way that placement will show it.
export function createCropContext(canvas, width, height) {
	return createSurfaceContext(canvas, width, height, 'cover')
}
