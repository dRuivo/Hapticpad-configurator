/**
 * BMP decoder for monochrome BMP formats
 * Supports 1-bit (monochrome) BMPs
 */

export interface DecodedBmp {
	width: number;
	height: number;
	rgba: Uint8ClampedArray;
}

export function decodeBmp(input: ArrayBuffer | Uint8Array): DecodedBmp {
	const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;

	if (bytes.length < 54) {
		throw new Error('Invalid BMP: file too small');
	}

	// Check BMP signature
	if (bytes[0] !== 0x42 || bytes[1] !== 0x4d) {
		throw new Error('Invalid BMP: missing BM signature');
	}

	// Read BMP header
	const dataView = new DataView(bytes.buffer, bytes.byteOffset);
	const fileSize = dataView.getUint32(2, true);
	const dataOffset = dataView.getUint32(10, true);
	const headerSize = dataView.getUint32(14, true);

	if (headerSize < 40) {
		throw new Error('Invalid BMP: unsupported header format');
	}

	const width = dataView.getInt32(18, true);
	const height = dataView.getInt32(22, true);
	const planes = dataView.getUint16(26, true);
	const bitsPerPixel = dataView.getUint16(28, true);
	const compression = dataView.getUint32(30, true);

	if (planes !== 1) {
		throw new Error('Invalid BMP: unsupported planes count');
	}

	if (compression !== 0) {
		throw new Error('Invalid BMP: compression not supported');
	}

	if (bitsPerPixel !== 1) {
		throw new Error(`Invalid BMP: ${bitsPerPixel}-bit not supported (only 1-bit monochrome)`);
	}

	const absHeight = Math.abs(height);
	const isTopDown = height < 0;

	// Calculate row stride for 1-bit data (must be aligned to 4 bytes)
	const bitsPerRow = width * bitsPerPixel;
	const bytesPerRow = Math.ceil(bitsPerRow / 8);
	const rowStride = Math.ceil(bytesPerRow / 4) * 4;

	if (dataOffset + rowStride * absHeight > bytes.length) {
		throw new Error('Invalid BMP: file too small for image data');
	}

	// Decode pixel data
	const rgba = new Uint8ClampedArray(width * absHeight * 4);

	for (let y = 0; y < absHeight; y++) {
		// BMP rows are stored bottom-up by default (unless height is negative)
		const srcY = isTopDown ? y : absHeight - 1 - y;
		const srcRowOffset = dataOffset + srcY * rowStride;
		const dstRowOffset = y * width * 4;

		for (let x = 0; x < width; x++) {
			const byteIndex = srcRowOffset + Math.floor(x / 8);
			const bitIndex = 7 - (x % 8); // MSB first
			const bit = (bytes[byteIndex] >> bitIndex) & 1;

			// Convert bit to grayscale (0 = black, 1 = white)
			const gray = bit ? 255 : 0;

			const pixelIndex = dstRowOffset + x * 4;
			rgba[pixelIndex + 0] = gray; // R
			rgba[pixelIndex + 1] = gray; // G
			rgba[pixelIndex + 2] = gray; // B
			rgba[pixelIndex + 3] = 255; // A (fully opaque)
		}
	}

	return {
		width,
		height: absHeight,
		rgba
	};
}
