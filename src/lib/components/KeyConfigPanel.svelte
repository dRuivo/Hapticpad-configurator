<script lang="ts">
	import type { SelectedTarget, WheelMode, ActionSlot, Profile } from '$lib/model/types';
	import { isWheelSelected, isKeySelected } from '$lib/model/types';
	import { getKeycodeDisplayName } from '$lib/keycodes/map';

	interface Props {
		selectedTarget: SelectedTarget;
		profile?: Profile;
		label?: string;
		wheelMode?: WheelMode;
		wheelKey?: number;
		actions?: [ActionSlot | null, ActionSlot | null, ActionSlot | null];
		onLabelChange?: (value: string) => void;
		onWheelModeChange?: (mode: WheelMode) => void;
		onWheelKeyChange?: (keycode: number) => void;
		onActionChange?: (index: number, action: ActionSlot) => void;
		onActionClear?: (index: number) => void;
	}

	let {
		selectedTarget,
		profile,
		label = '',
		wheelMode = 'Clicky',
		wheelKey = 0,
		actions = [null, null, null],
		onLabelChange,
		onWheelModeChange,
		onWheelKeyChange,
		onActionChange,
		onActionClear
	}: Props = $props();

	// Get actual wheel config from profile
	const actualWheelMode = $derived(profile?.wheelMode || wheelMode);
	const actualWheelKey = $derived(profile?.wheelKey || wheelKey);

	// Get actual actions from selected key
	const actualActions = $derived(() => {
		if (isKeySelected(selectedTarget) && profile) {
			const key = profile.keys[selectedTarget.index];
			return key?.actions || [null, null, null];
		}
		return actions;
	});

	function handleLabelInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onLabelChange?.(target.value);
	}

	function handleWheelModeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onWheelModeChange?.(target.value as WheelMode);
	}

	function handleWheelKeyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = Math.max(0, parseInt(target.value) || 0);
		onWheelKeyChange?.(value);
	}

	function handleActionDelayChange(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const delayMs = Math.max(0, parseInt(target.value) || 0);
		const currentAction = actualActions()[index];
		const keycode = currentAction?.keycode || 0;
		onActionChange?.(index, { delayMs, keycode });
	}

	function handleActionKeycodeChange(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const keycode = Math.max(0, parseInt(target.value) || 0);
		const currentAction = actualActions()[index];
		const delayMs = currentAction?.delayMs || 0;
		onActionChange?.(index, { delayMs, keycode });
	}

	function clearAction(index: number) {
		onActionClear?.(index);
	}

	function handleCaptureKeybind() {
		// Placeholder for future keybind capture functionality
		alert('Keybind capture functionality coming soon!');
	}
</script>

<div class="config-panel">
	{#if isWheelSelected(selectedTarget)}
		<h2>🎛️ Haptic Wheel</h2>

		<div class="config-section">
			<label for="wheel-mode">Wheel Mode:</label>
			<select id="wheel-mode" value={actualWheelMode} onchange={handleWheelModeChange}>
				<option value="Clicky">Clicky</option>
				<option value="Twist">Twist</option>
				<option value="Momentum">Momentum</option>
			</select>
		</div>

		<div class="config-section">
			<label for="wheel-key">Wheel Key:</label>
			<div class="keycode-input">
				<input
					id="wheel-key"
					type="number"
					value={actualWheelKey}
					onchange={handleWheelKeyChange}
					min="0"
					placeholder="0"
				/>
				<span class="keycode-display">{getKeycodeDisplayName(actualWheelKey)}</span>
			</div>
			<div class="helper-text">
				Keycode from <a
					href="https://keycode-visualizer.netlify.app"
					target="_blank"
					rel="noopener noreferrer">keycode-visualizer</a
				>
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
			<h3>Actions</h3>
			<div class="actions-list">
				{#each actualActions() as action, index}
					<div class="action-row">
						<span class="action-label">Action {index + 1}:</span>
						<div class="action-inputs">
							<div class="input-group">
								<label for="delay-{index}">Delay (ms):</label>
								<input
									id="delay-{index}"
									type="number"
									value={action?.delayMs ?? 0}
									onchange={(e) => handleActionDelayChange(index, e)}
									min="0"
									placeholder="0"
								/>
							</div>
							<div class="input-group keycode-group">
								<label for="keycode-{index}">Keycode:</label>
								<div class="keycode-input">
									<input
										id="keycode-{index}"
										type="number"
										value={action?.keycode ?? 0}
										onchange={(e) => handleActionKeycodeChange(index, e)}
										min="0"
										placeholder="0"
									/>
									<span class="keycode-display">{getKeycodeDisplayName(action?.keycode ?? 0)}</span>
								</div>
							</div>
							<button
								class="clear-button"
								onclick={() => clearAction(index)}
								aria-label="Clear action {index + 1}"
							>
								Clear
							</button>
						</div>
						<div class="action-preview">
							Preview: {action?.delayMs ?? 0},{action?.keycode ?? 0}
						</div>
					</div>
				{/each}
			</div>
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

	input,
	select {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		box-sizing: border-box;
		transition: all 0.2s ease;
		background: #f7fafc;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #3498db;
		background: #fff;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}

	h3 {
		margin: 0 0 16px 0;
		color: #4a5568;
		font-size: 18px;
		font-weight: 600;
	}

	.keycode-input {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.keycode-input input {
		flex: 0 0 auto;
		width: 80px;
	}

	.keycode-display {
		color: #718096;
		font-size: 13px;
		font-style: italic;
		white-space: nowrap;
	}

	.helper-text {
		margin-top: 4px;
		font-size: 12px;
		color: #718096;
	}

	.helper-text a {
		color: #3498db;
		text-decoration: none;
	}

	.helper-text a:hover {
		text-decoration: underline;
	}

	/* Removed empty actions-list rule */

	.action-row {
		padding: 16px;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background: #fafafa;
		margin-bottom: 16px;
	}

	.action-label {
		display: block;
		font-weight: 600;
		color: #4a5568;
		margin-bottom: 12px;
	}

	.action-inputs {
		display: flex;
		align-items: flex-end;
		gap: 12px;
		margin-bottom: 8px;
	}

	.input-group {
		flex: 1;
	}

	.input-group label {
		margin-bottom: 4px;
		font-size: 12px;
	}

	.keycode-group {
		flex: 2;
	}

	.clear-button {
		background: #e53e3e;
		color: white;
		border: none;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		height: fit-content;
	}

	.clear-button:hover {
		background: #c53030;
		transform: translateY(-1px);
	}

	.action-preview {
		font-size: 12px;
		color: #718096;
		font-family: 'Courier New', monospace;
		background: #f7fafc;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
	}

	@media (max-width: 768px) {
		.config-panel {
			margin-top: 20px;
			padding: 20px;
		}
	}
</style>
