<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActionSlot } from '$lib/model/types';
	import {
		normalizeKeyEvent,
		getKeycodeDisplayName,
		isValidCaptureKey,
		buildChordActions
	} from '$lib/keycodes/capture';

	interface Props {
		isOpen: boolean;
		mode: 'wheel' | 'macro';
		context?: {
			profileName?: string;
			keyIndex?: number;
			actionIndex?: number;
		};
		onCancel: () => void;
		onConfirm: (payload: WheelPayload | MacroPayload) => void;
	}

	interface WheelPayload {
		type: 'wheel';
		wheelKey: number;
	}

	interface MacroPayload {
		type: 'macro';
		actionIndex?: number;
		keyCode?: number;
		actions?: [ActionSlot | null, ActionSlot | null, ActionSlot | null];
	}

	let { isOpen, mode, context, onCancel, onConfirm }: Props = $props();

	let captureModal: HTMLElement;
	let liveKeyCode = $state<number | null>(null);
	let liveKeyName = $state('');
	let liveModifiers = $state('');
	let previousActiveElement: HTMLElement | null = null;
	let isChord = $state(false);

	onMount(() => {
		return () => {
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement as HTMLElement;
			document.body.style.overflow = 'hidden';
			setTimeout(() => {
				captureModal?.focus();
			}, 0);
		} else {
			document.body.style.overflow = '';
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
			// Reset live state when modal closes
			liveKeyCode = null;
			liveKeyName = '';
			liveModifiers = '';
			isChord = false;
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		event.preventDefault();
		event.stopPropagation();

		// Escape cancels
		if (event.keyCode === 27) {
			onCancel();
			return;
		}

		// Update live preview
		const normalized = normalizeKeyEvent(event);
		liveKeyCode = normalized.keyCode;
		liveKeyName = normalized.name;

		// Build modifier string
		const modifierParts: string[] = [];
		if (normalized.ctrl) modifierParts.push('Ctrl');
		if (normalized.shift) modifierParts.push('Shift');
		if (normalized.alt) modifierParts.push('Alt');
		if (normalized.meta) modifierParts.push('Cmd');

		isChord = modifierParts.length > 0;
		liveModifiers = modifierParts.join(' + ');
	}

	function handleKeyup(event: KeyboardEvent) {
		if (!isOpen) return;

		event.preventDefault();
		event.stopPropagation();

		// Check if this is a valid key to capture
		if (!isValidCaptureKey(event)) {
			return;
		}

		// Commit the capture
		if (mode === 'wheel') {
			// For wheel, capture only the main key
			const normalized = normalizeKeyEvent(event);
			if (normalized.keyCode > 0) {
				onConfirm({
					type: 'wheel',
					wheelKey: normalized.keyCode
				});
			}
		} else if (mode === 'macro') {
			// For macro, build chord actions
			const { actions, warning } = buildChordActions(event);

			// For single key captures, only fill the target slot
			const normalized = normalizeKeyEvent(event);
			const isModifierKey = [16, 17, 18, 91, 92, 93].includes(normalized.keyCode);
			const hasModifiers = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

			if (isModifierKey || !hasModifiers) {
				// Single key capture - only fill the clicked slot
				onConfirm({
					type: 'macro',
					actionIndex: context?.actionIndex,
					keyCode: normalized.keyCode
				} as unknown as MacroPayload);
			} else {
				// Chord capture - fill all 3 slots
				onConfirm({
					type: 'macro',
					actions
				});
			}
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

{#if isOpen}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
		<div
			class="capture-modal"
			bind:this={captureModal}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby="capture-title"
		>
			<h2 id="capture-title">Press a key…</h2>

			<p class="capture-instructions">
				Press ESC to cancel. This captures keycodes compatible with Hapticpad (keycode-visualizer).
			</p>

			<div class="live-preview">
				{#if liveKeyCode !== null}
					<div class="preview-content">
						<div class="preview-keycode">
							<span class="label">Keycode:</span>
							<span class="value">{liveKeyCode}</span>
						</div>

						<div class="preview-name">
							<span class="label">Key:</span>
							<span class="value">{liveKeyName}</span>
						</div>

						{#if liveModifiers}
							<div class="preview-modifiers">
								<span class="label">Modifiers:</span>
								<span class="value">{liveModifiers}</span>
							</div>
						{/if}

						{#if isChord}
							<div class="preview-chord-note">
								This will capture a chord (multiple simultaneous keys)
							</div>
						{/if}
					</div>
				{:else}
					<div class="preview-waiting">Waiting for key press…</div>
				{/if}
			</div>

			<div class="capture-info">
				<p>
					{#if mode === 'wheel'}
						Capture will set the wheel's keycode. Modifiers will be ignored.
					{:else}
						Capture will fill action slot(s) for this key.
						{#if isChord}
							Multiple keys will fill all 3 action slots.
						{/if}
					{/if}
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.capture-modal {
		background: white;
		border-radius: 12px;
		padding: 32px;
		max-width: 480px;
		width: 100%;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
		position: relative;
		outline: none;
	}

	h2 {
		margin: 0 0 8px 0;
		color: #2d3748;
		font-size: 22px;
		font-weight: 600;
	}

	.capture-instructions {
		margin: 0 0 24px 0;
		color: #718096;
		font-size: 13px;
		line-height: 1.5;
	}

	.live-preview {
		padding: 24px;
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		margin-bottom: 24px;
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-content {
		width: 100%;
	}

	.preview-waiting {
		color: #cbd5e0;
		font-size: 16px;
		text-align: center;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.preview-keycode,
	.preview-name,
	.preview-modifiers {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding: 12px;
		background: white;
		border-radius: 6px;
		border: 1px solid #cbd5e0;
	}

	.preview-keycode:last-of-type,
	.preview-name:last-of-type,
	.preview-modifiers:last-of-type {
		margin-bottom: 0;
	}

	.label {
		font-weight: 600;
		color: #4a5568;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.value {
		font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
		font-size: 16px;
		font-weight: 600;
		color: #2d3748;
	}

	.preview-chord-note {
		margin-top: 12px;
		padding: 12px;
		background: #fffbf0;
		border: 1px solid #fbd38d;
		border-radius: 6px;
		color: #744210;
		font-size: 13px;
		font-style: italic;
	}

	.capture-info {
		padding: 12px 16px;
		background: #edf2f7;
		border-radius: 6px;
		border-left: 4px solid #4299e1;
	}

	.capture-info p {
		margin: 0;
		color: #2d3748;
		font-size: 13px;
		line-height: 1.5;
	}

	@media (max-width: 600px) {
		.capture-modal {
			padding: 24px;
		}

		h2 {
			font-size: 18px;
		}

		.live-preview {
			min-height: 100px;
		}
	}
</style>
