<script lang="ts">
	import type { SelectedTarget, Profile } from '$lib/model/types';
	import { decodeBmp, type DecodedBmp } from '$lib/graphics/bmp';
	import { rgbaToPngDataUrlSync } from '$lib/graphics/raster';
	import { browser } from '$app/environment';

	interface Props {
		selectedTarget: SelectedTarget;
		labels: string[];
		icons?: string[];
		profile?: Profile;
		onSelectWheel: () => void;
		onSelectKey: (index: number) => void;
		onIconDecodeError?: (error: string) => void;
	}

	let {
		selectedTarget,
		labels,
		icons = ['⬆', '⬇', '📋', '⌨', '🖱', '⚙'],
		profile,
		onSelectWheel,
		onSelectKey,
		onIconDecodeError
	}: Props = $props();

	// Icon cache to avoid re-decoding on every render
	let iconCache = $state<Map<string, string | null>>(new Map());
	let errorCount = $state(0);
	const MAX_ERROR_REPORTS = 3;

	// Compute cache key for profile + key index
	function getCacheKey(profileId: string, keyIndex: number, bmpLength: number): string {
		return `${profileId}-${keyIndex}-${bmpLength}`;
	}

	// Decode BMP to data URL with caching (pure function - no state mutations)
	function getIconDataUrl(keyIndex: number): string | null {
		if (!browser || !profile?.keys[keyIndex]?.bmp) {
			return null;
		}

		const bmp = profile.keys[keyIndex].bmp;
		if (!bmp) return null;

		const bmpLength =
			bmp instanceof Uint8Array
				? bmp.length
				: bmp instanceof ArrayBuffer
					? bmp.byteLength
					: bmp instanceof Blob
						? bmp.size
						: 0;

		const cacheKey = getCacheKey(profile.id, keyIndex, bmpLength);

		// Check cache first
		if (iconCache.has(cacheKey)) {
			return iconCache.get(cacheKey) || null;
		}

		// If not in cache, return null and schedule async decoding
		if (!bmp) return null;

		scheduleIconDecode(keyIndex, cacheKey);
		return null;
	}

	// Schedule icon decoding in an effect (can mutate state)
	function scheduleIconDecode(keyIndex: number, cacheKey: string) {
		if (!profile?.keys[keyIndex]?.bmp) return;

		const bmp = profile.keys[keyIndex].bmp;
		if (!bmp) return;

		// Use setTimeout to avoid mutating state in template
		setTimeout(() => {
			// Double check we still need this
			if (iconCache.has(cacheKey)) return;

			try {
				let bmpData: Uint8Array;

				if (bmp instanceof Uint8Array) {
					bmpData = bmp;
				} else if (bmp instanceof ArrayBuffer) {
					bmpData = new Uint8Array(bmp);
				} else {
					// For Blob, we can't decode synchronously
					iconCache.set(cacheKey, null);
					return;
				}

				const decoded = decodeBmp(bmpData);
				const dataUrl = rgbaToPngDataUrlSync(decoded.rgba, decoded.width, decoded.height);

				iconCache.set(cacheKey, dataUrl);
			} catch (error) {
				// Cache the failure to avoid retrying
				iconCache.set(cacheKey, null);

				// Report error (but limit spam)
				if (errorCount < MAX_ERROR_REPORTS && onIconDecodeError) {
					errorCount++;
					const errorMsg = `Failed to decode icon for key ${keyIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
					onIconDecodeError(errorMsg);
				}
			}
		}, 0);
	}

	// Clear cache when profile changes
	let currentProfileId = $state<string | undefined>(undefined);
	$effect(() => {
		if (profile?.id && profile.id !== currentProfileId) {
			// Profile changed - clear cache for old profile
			const oldCache = iconCache;
			const newCache = new Map<string, string | null>();
			for (const [key, value] of oldCache) {
				if (key.startsWith(profile.id + '-')) {
					newCache.set(key, value);
				}
			}
			iconCache = newCache;
			errorCount = 0; // Reset error count for new profile
			currentProfileId = profile.id;
		}
	});

	function handleWheelClick() {
		onSelectWheel();
	}

	function handleKeyClick(keyIndex: number) {
		onSelectKey(keyIndex);
	}

	function handleWheelKeyboard(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleWheelClick();
		}
	}

	function handleKeyKeyboard(event: KeyboardEvent, keyIndex: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleKeyClick(keyIndex);
		}
	}

	function getTruncatedLabel(label: string): string {
		return label.length > 8 ? label.substring(0, 8) : label;
	}

	function isWheelSelected(): boolean {
		return selectedTarget.kind === 'wheel';
	}

	function isKeySelected(index: number): boolean {
		return selectedTarget.kind === 'key' && selectedTarget.index === index;
	}
</script>

<div class="macropad-container">
	<svg viewBox="0 0 400 280" class="macropad-svg">
		<!-- Device body -->
		<rect x="10" y="10" width="380" height="260" rx="20" ry="20" class="device-body" />

		<!-- Left side: Haptic wheel -->
		<g class="wheel-section">
			<!-- LED ring (outer) -->
			<circle cx="110" cy="140" r="50" class="led-ring" />
			<!-- Wheel (clickable) -->
			<circle
				cx="110"
				cy="140"
				r="40"
				class="wheel {isWheelSelected() ? 'selected' : ''}"
				role="button"
				tabindex="0"
				onclick={handleWheelClick}
				onkeydown={handleWheelKeyboard}
			/>
			<!-- Wheel center dot -->
			<circle cx="110" cy="140" r="6" class="wheel-center" />
			<!-- Wheel label -->
			<text x="110" y="210" class="wheel-label">WHEEL</text>
		</g>

		<!-- Right side: Button area -->
		<g class="button-section">
			<!-- Top row buttons (0, 1, 2) -->
			{#each Array(3) as _, i}
				{@const x = 220 + i * 50}
				{@const y = 60}
				<rect
					id="key-{i}"
					{x}
					{y}
					width="40"
					height="35"
					rx="6"
					ry="6"
					class="key {isKeySelected(i) ? 'selected' : ''}"
					role="button"
					tabindex="0"
					onclick={() => handleKeyClick(i)}
					onkeydown={(e) => handleKeyKeyboard(e, i)}
				/>
			{/each}

			<!-- Display area (between rows) -->
			<rect x="220" y="110" width="150" height="80" rx="8" ry="8" class="display-area" />

			<!-- Display content grid (2x3 matching button layout) -->
			{#each Array(6) as _, i}
				{@const displayRow = Math.floor(i / 3)}
				{@const displayCol = i % 3}
				{@const displayX = 230 + displayCol * 43}
				{@const displayY = 125 + displayRow * 35}
				{@const iconDataUrl = getIconDataUrl(i)}

				<g class="display-item">
					<!-- Item background -->
					<rect x={displayX} y={displayY} width="40" height="30" rx="3" class="display-item-bg" />

					<!-- Icon (BMP or fallback) -->
					{#if iconDataUrl}
						<!-- Real BMP icon -->
						<image
							href={iconDataUrl}
							x={displayX + 2}
							y={displayY + 2}
							width="24"
							height="18"
							preserveAspectRatio="xMidYMid meet"
							class="display-bmp-icon"
						/>
					{:else if profile?.keys[i]?.bmp}
						<!-- BMP failed to decode - show error placeholder -->
						<rect
							x={displayX + 4}
							y={displayY + 4}
							width="20"
							height="14"
							rx="2"
							class="display-icon-error"
						/>
						<text x={displayX + 14} y={displayY + 13} class="display-icon-error-text">✕</text>
					{:else if icons[i]}
						<!-- Fallback to text icon if available -->
						<text x={displayX + 14} y={displayY + 13} class="display-icon">{icons[i]}</text>
					{:else}
						<!-- No BMP or icon - show placeholder box -->
						<rect
							x={displayX + 4}
							y={displayY + 4}
							width="20"
							height="14"
							rx="2"
							class="display-icon-placeholder"
						/>
						<text x={displayX + 14} y={displayY + 13} class="display-icon-placeholder-text">□</text>
					{/if}

					<!-- Label -->
					{#if labels[i]}
						<text x={displayX + 20} y={displayY + 25} class="display-label">
							{getTruncatedLabel(labels[i])}
						</text>
					{:else}
						<text x={displayX + 20} y={displayY + 25} class="display-label placeholder">
							Key{i + 1}
						</text>
					{/if}
				</g>
			{/each}

			<!-- Bottom row buttons (3, 4, 5) -->
			{#each Array(3) as _, i}
				{@const keyIndex = i + 3}
				{@const x = 220 + i * 50}
				{@const y = 210}
				<rect
					id="key-{keyIndex}"
					{x}
					{y}
					width="40"
					height="35"
					rx="6"
					ry="6"
					class="key {isKeySelected(keyIndex) ? 'selected' : ''}"
					role="button"
					tabindex="0"
					onclick={() => handleKeyClick(keyIndex)}
					onkeydown={(e) => handleKeyKeyboard(e, keyIndex)}
				/>
			{/each}
		</g>
	</svg>
</div>

<style>
	.macropad-container {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.macropad-svg {
		width: 100%;
		height: auto;
		border: 2px solid #333;
		border-radius: 15px;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.device-body {
		fill: #2c3e50;
		stroke: #1a252f;
		stroke-width: 2;
	}

	/* Wheel styles */
	.led-ring {
		fill: none;
		stroke: #ff6b6b;
		stroke-width: 6;
		opacity: 0.8;
		filter: drop-shadow(0 0 8px #ff6b6b);
	}

	.wheel {
		fill: #34495e;
		stroke: #4a6741;
		stroke-width: 3;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.wheel:hover {
		fill: #3d566e;
		stroke: #5a7c50;
	}

	.wheel:focus {
		outline: none;
		stroke: #3498db;
		stroke-width: 4;
	}

	.wheel.selected {
		fill: #4668a1;
		stroke: #3498db;
		stroke-width: 5;
	}

	.wheel-center {
		fill: #95a5a6;
		pointer-events: none;
	}

	.wheel-label {
		fill: #bdc3c7;
		font-family: Arial, sans-serif;
		font-size: 12px;
		font-weight: bold;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}

	/* Button styles */
	.key {
		fill: #4a5568;
		stroke: #2d3748;
		stroke-width: 2;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.key:hover {
		fill: #5a6578;
		stroke: #3d4758;
	}

	.key:focus {
		outline: none;
		stroke: #3498db;
		stroke-width: 3;
	}

	.key.selected {
		fill: #6a7588;
		stroke: #3498db;
		stroke-width: 4;
	}

	/* Display styles */
	.display-area {
		fill: #1a202c;
		stroke: #4a5568;
		stroke-width: 2;
	}

	.display-item-bg {
		fill: #2d3748;
		stroke: #4a5568;
		stroke-width: 1;
	}

	.display-icon {
		fill: #f7fafc;
		font-family: Arial, sans-serif;
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}

	.display-bmp-icon {
		pointer-events: none;
	}

	.display-icon-placeholder {
		fill: none;
		stroke: #4a5568;
		stroke-width: 1;
		stroke-dasharray: 2, 2;
	}

	.display-icon-placeholder-text {
		fill: #718096;
		font-family: Arial, sans-serif;
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}

	.display-icon-error {
		fill: #fed7d7;
		stroke: #e53e3e;
		stroke-width: 1;
	}

	.display-icon-error-text {
		fill: #e53e3e;
		font-family: Arial, sans-serif;
		font-size: 10px;
		font-weight: bold;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}

	.display-label {
		fill: #e2e8f0;
		font-family: 'Courier New', monospace;
		font-size: 8px;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}

	.display-label.placeholder {
		fill: #718096;
		font-style: italic;
	}
</style>
