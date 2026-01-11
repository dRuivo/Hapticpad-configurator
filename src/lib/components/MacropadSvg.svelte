<script lang="ts">
	import type { SelectedTarget } from '$lib/model/types';

	interface Props {
		selectedTarget: SelectedTarget;
		labels: string[];
		icons?: string[];
		onSelectWheel: () => void;
		onSelectKey: (index: number) => void;
	}

	let {
		selectedTarget,
		labels,
		icons = ['⬆', '⬇', '📋', '⌨', '🖱', '⚙'],
		onSelectWheel,
		onSelectKey
	}: Props = $props();

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

				<g class="display-item">
					<!-- Item background -->
					<rect x={displayX} y={displayY} width="40" height="30" rx="3" class="display-item-bg" />

					<!-- Icon -->
					<text x={displayX + 8} y={displayY + 12} class="display-icon">{icons[i]}</text>

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
