<script lang="ts">
	interface Props {
		selectedKey: number;
		label: string;
		onLabelChange: (value: string) => void;
	}

	let { selectedKey, label, onLabelChange }: Props = $props();

	function handleLabelInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onLabelChange(target.value);
	}

	function handleCaptureKeybind() {
		// Placeholder for future keybind capture functionality
		alert('Keybind capture functionality coming soon!');
	}
</script>

<div class="config-panel">
	<h2>Key {selectedKey + 1}</h2>

	<div class="config-section">
		<label for="key-label">Label:</label>
		<input
			id="key-label"
			type="text"
			value={label}
			oninput={handleLabelInput}
			placeholder="Enter key label..."
			maxlength="20"
		/>
	</div>

	<div class="config-section">
		<button type="button" class="capture-button" onclick={handleCaptureKeybind}>
			Capture keybind
		</button>
	</div>

	<div class="config-info">
		<p class="info-text">
			Configure the label and keybind for key {selectedKey + 1}. The label will be displayed on the
			macropad.
		</p>
	</div>
</div>

<style>
	.config-panel {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 20px;
		min-height: 300px;
	}

	h2 {
		margin: 0 0 20px 0;
		color: #333;
		font-size: 24px;
		border-bottom: 2px solid #0066cc;
		padding-bottom: 8px;
	}

	.config-section {
		margin-bottom: 20px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: bold;
		color: #555;
	}

	input {
		width: 100%;
		padding: 10px;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
		transition: border-color 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: #0066cc;
	}

	.capture-button {
		background: #0066cc;
		color: white;
		border: none;
		padding: 12px 20px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: bold;
		cursor: pointer;
		transition: background-color 0.2s ease;
		width: 100%;
	}

	.capture-button:hover {
		background: #0052a3;
	}

	.capture-button:active {
		background: #003f80;
	}

	.config-info {
		margin-top: 30px;
		padding: 15px;
		background: #f8f9fa;
		border-radius: 6px;
		border-left: 4px solid #0066cc;
	}

	.info-text {
		margin: 0;
		color: #666;
		font-size: 14px;
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.config-panel {
			margin-top: 20px;
		}
	}
</style>
