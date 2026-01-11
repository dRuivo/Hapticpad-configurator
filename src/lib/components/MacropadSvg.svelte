<script lang="ts">
	interface Props {
		selectedKey: number;
		onSelect: (keyIndex: number) => void;
		labels: string[];
	}

	let { selectedKey, onSelect, labels }: Props = $props();

	function handleKeyClick(keyIndex: number) {
		onSelect(keyIndex);
	}

	function handleKeyboardEvent(event: KeyboardEvent, keyIndex: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleKeyClick(keyIndex);
		}
	}

	function getTruncatedLabel(label: string): string {
		return label.length > 6 ? label.substring(0, 6) : label;
	}
</script>

<div class="macropad-container">
	<svg viewBox="0 0 300 200" class="macropad-svg">
		<!-- Device body -->
		<rect x="10" y="10" width="280" height="180" rx="15" ry="15" class="device-body" />

		<!-- Display area -->
		<rect x="30" y="30" width="240" height="40" rx="5" ry="5" class="display-area" />
		<text x="150" y="55" class="display-text">HAPTIC MACROPAD</text>

		<!-- Key grid (2x3) -->
		{#each Array(6) as _, i}
			{@const row = Math.floor(i / 3)}
			{@const col = i % 3}
			{@const x = 50 + col * 70}
			{@const y = 90 + row * 60}

			<g>
				<!-- Key background -->
				<rect
					id="key-{i}"
					{x}
					{y}
					width="50"
					height="40"
					rx="8"
					ry="8"
					class="key {selectedKey === i ? 'selected' : ''}"
					role="button"
					tabindex="0"
					onclick={() => handleKeyClick(i)}
					onkeydown={(e) => handleKeyboardEvent(e, i)}
				/>

				<!-- Key number -->
				<text x={x + 8} y={y + 12} class="key-number">{i + 1}</text>

				<!-- Key label -->
				{#if labels[i]}
					<text x={x + 25} y={y + 28} class="key-label">
						{getTruncatedLabel(labels[i])}
					</text>
				{/if}
			</g>
		{/each}
	</svg>
</div>

<style>
	.macropad-container {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.macropad-svg {
		width: 100%;
		height: auto;
		border: 2px solid #333;
		border-radius: 12px;
		background: #f5f5f5;
	}

	.device-body {
		fill: #2a2a2a;
		stroke: #000;
		stroke-width: 2;
	}

	.display-area {
		fill: #000;
		stroke: #555;
		stroke-width: 1;
	}

	.display-text {
		fill: #00ff00;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		text-anchor: middle;
		font-weight: bold;
	}

	.key {
		fill: #4a4a4a;
		stroke: #666;
		stroke-width: 2;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.key:hover {
		fill: #5a5a5a;
		stroke: #777;
	}

	.key:focus {
		outline: none;
		stroke: #0066cc;
		stroke-width: 3;
	}

	.key.selected {
		fill: #6a6a6a;
		stroke: #00aaff;
		stroke-width: 4;
	}

	.key-number {
		fill: #ccc;
		font-family: Arial, sans-serif;
		font-size: 10px;
		font-weight: bold;
		pointer-events: none;
		user-select: none;
	}

	.key-label {
		fill: #fff;
		font-family: Arial, sans-serif;
		font-size: 10px;
		text-anchor: middle;
		pointer-events: none;
		user-select: none;
	}
</style>
