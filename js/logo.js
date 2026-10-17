// The brand artwork: fetching it, making it safe to rasterise, and drawing it. This is the
// only module that reads the SVG file.

import { LOGO } from './config.js'

const LOGO_ASPECT = LOGO.content.width / LOGO.content.height

// The decoded artwork, kept for the life of the page. Null until loadLogo() resolves.
let logoImage = null

// The size the artwork needs to be drawn at to come out `width` wide, ink included.
export function logoSize(width) {
	return { width, height: width / LOGO_ASPECT }
}

// The artwork is fetched as text so its root can be given an explicit raster size: an SVG
// with only a viewBox has no reliable intrinsic size and would otherwise be rasterised too
// small to upscale cleanly. The tracked file on disk is never modified.
function normalizeSvg(text) {
	const parsed = new DOMParser().parseFromString(text, 'image/svg+xml')
	if (parsed.querySelector('parsererror') !== null) {
		throw new Error('the file is not valid SVG')
	}
	const svg = parsed.documentElement
	svg.setAttribute('width', String(LOGO.raster))
	svg.setAttribute('height', String(LOGO.raster))

	// Drop editor-only elements (Boxy SVG export metadata).
	const svgNamespace = 'http://www.w3.org/2000/svg'
	for (const element of Array.from(svg.querySelectorAll('*'))) {
		if (element.namespaceURI !== svgNamespace) {
			element.remove()
		}
	}
	return new XMLSerializer().serializeToString(svg)
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error('the file could not be decoded'))
		image.src = url
	})
}

export async function loadLogo() {
	const response = await fetch(LOGO.src)
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}
	const svg = normalizeSvg(await response.text())
	// A blob URL inherits this page's origin, so the canvas stays untainted and the export
	// keeps working. The URL is deliberately kept alive for the life of the page rather than
	// revoked, so the decoded image is never discarded.
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
	logoImage = await loadImage(url)
}

// Draws the artwork's ink bounds into `rect`, in the poster's own coordinates. Cropping the
// source to its ink is what makes the drawn size mean the logo's real size.
export function drawLogo(ctx, rect) {
	if (logoImage === null) {
		return
	}
	const sourceScale = LOGO.raster / LOGO.viewBox
	const source = LOGO.content
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
	)
}

export function describeLogoFailure(error) {
	if (location.protocol === 'file:') {
		return `Open this page over http:// — browsers refuse to load ${LOGO.src} from a file:// URL.`
	}
	return `Could not load ${LOGO.src} (${error.message}). The poster needs it.`
}
