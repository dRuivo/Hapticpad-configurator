/**
 * Utilities for converting RGBA pixel data to PNG data URLs using Canvas
 */

import { browser } from '$app/environment';

export async function rgbaToPngDataUrl(rgba: Uint8ClampedArray, width: number, height: number): Promise<string> {
	// Guard against SSR
	if (typeof document === 'undefined' || typeof OffscreenCanvas === 'undefined') {
		throw new Error('rgbaToPngDataUrl can only be used in browser environment');
	}
	
	try {
		// Use OffscreenCanvas for better performance
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		
		if (!ctx) {
			throw new Error('Failed to get 2D context from OffscreenCanvas');
		}
		
		// Create a compatible Uint8ClampedArray
		const compatibleRgba = new Uint8ClampedArray(rgba);
		const imageData = new ImageData(compatibleRgba, width, height);
		ctx.putImageData(imageData, 0, 0);
		
		// Convert to blob and then to data URL
		return canvas.convertToBlob({ type: 'image/png' }).then(blob => {
			return new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		});
		
	} catch (offscreenError) {
		// Fallback to regular canvas if OffscreenCanvas fails
		try {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new Error('Failed to get 2D context from regular canvas');
			}
			
			const compatibleRgba = new Uint8ClampedArray(rgba);
			const imageData = new ImageData(compatibleRgba, width, height);
			ctx.putImageData(imageData, 0, 0);
			
			// Convert to blob and then to data URL
			return new Promise<string>((resolve, reject) => {
				canvas.toBlob(blob => {
					if (!blob) {
						reject(new Error('Failed to convert canvas to blob'));
						return;
					}
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				}, 'image/png');
			});
			
		} catch (canvasError) {
			throw new Error(`Failed to convert RGBA to PNG: ${canvasError}, Offscreen error: ${offscreenError}`);
		}
	}
}

export function rgbaToPngDataUrlSync(rgba: Uint8ClampedArray, width: number, height: number): string {
	if (!browser) {
		throw new Error('rgbaToPngDataUrlSync can only be used in browser environment');
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get 2D context');
	}
	
	// Create a compatible Uint8ClampedArray
	const compatibleRgba = new Uint8ClampedArray(rgba);
	const imageData = new ImageData(compatibleRgba, width, height);
	ctx.putImageData(imageData, 0, 0);
	
	return canvas.toDataURL('image/png');
}

export function rgbaToPngDataUrlSyncFallback(rgba: Uint8ClampedArray, width: number, height: number): string {
	if (typeof document === 'undefined') {
		throw new Error('rgbaToPngDataUrlSyncFallback requires document to be available');
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get 2D context');
	}
	
	// Create a compatible Uint8ClampedArray
	const compatibleRgba = new Uint8ClampedArray(rgba);
	const imageData = new ImageData(compatibleRgba, width, height);
	ctx.putImageData(imageData, 0, 0);
	
	return canvas.toDataURL('image/png');
}