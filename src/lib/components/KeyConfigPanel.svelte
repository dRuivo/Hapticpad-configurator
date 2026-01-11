<script lang="ts">
	import type { SelectedTarget } from '$lib/model/types';
	import { isWheelSelected, isKeySelected } from '$lib/model/types';

	interface Props {
		selectedTarget: SelectedTarget;
		label?: string;
		onLabelChange?: (value: string) => void;
	}

	let { selectedTarget, label = '', onLabelChange }: Props = $props();

	function handleLabelInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onLabelChange?.(target.value);
	}

	function handleCaptureKeybind() {
		// Placeholder for future keybind capture functionality
		alert('Keybind capture functionality coming soon!');
	}
</script>

<div class="config-panel">
	{#if isWheelSelected(selectedTarget)}
		<h2>🎛️ Haptic Wheel</h2>
		<div class="wheel-info">
			<p class="info-text">
				The haptic wheel is a rotary encoder with RGB LED ring. It provides tactile feedback for
				scrolling and volume control.
			</p>
			<div class="feature-note">
				<strong>Note:</strong> Wheel configuration is not available in this prototype. Future updates
				will allow customizing wheel actions and RGB lighting patterns.
			</div>
		</div>
	{:else if isKeySelected(selectedTarget)}
		<h2>Key {selectedTarget.index + 1}</h2>

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
				Configure the label and keybind for key {selectedTarget.index + 1}. The label will be
				displayed on the device's screen.
			</p>
		</div>
	{/if}
</div>

<style>
	.config-panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 24px;
		min-height: 320px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin: 0 0 24px 0;
		color: #2d3748;
		font-size: 24px;
		border-bottom: 2px solid #3498db;
		padding-bottom: 12px;
		font-weight: 600;
	}

	.config-section {
		margin-bottom: 24px;
	}

	label {
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		color: #4a5568;
		font-size: 14px;
	}

	input {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		box-sizing: border-box;
		transition: all 0.2s ease;
		background: #f7fafc;
	}

	input:focus {
		outline: none;
		border-color: #3498db;
		background: #fff;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	.capture-button {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		border: none;
		padding: 14px 20px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
	}

	.capture-button:hover {
		background: linear-gradient(135deg, #2980b9 0%, #1f6ba6 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
	}

	.capture-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
	}

	.config-info {
		margin-top: 30px;
		padding: 18px;
		background: #f0f8ff;
		border-radius: 8px;
		border-left: 4px solid #3498db;
	}

	.wheel-info {
		margin-top: 20px;
	}

	.feature-note {
		margin-top: 16px;
		padding: 12px;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		color: #856404;
		font-size: 13px;
	}

	.info-text {
		margin: 0;
		color: #718096;
		font-size: 14px;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.config-panel {
			margin-top: 20px;
			padding: 20px;
		}
	}
</style>
