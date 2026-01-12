<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		show: boolean;
		onDismiss: () => void;
	}

	let { show, onDismiss }: Props = $props();

	let dontShowAgain = $state(false);
	let previousActiveElement: HTMLElement | null = null;
	let focusableElements: HTMLElement[] = [];

	onMount(() => {
		return () => {
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		if (show) {
			previousActiveElement = document.activeElement as HTMLElement;
			document.body.style.overflow = 'hidden';

			// Update focusable elements and focus button
			setTimeout(() => {
				const button = document.querySelector('[data-onboarding-button]') as HTMLButtonElement;
				button?.focus();
				updateFocusableElements();
			}, 0);
		} else {
			document.body.style.overflow = '';
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}
	});

	function updateFocusableElements() {
		const modal = document.querySelector('[data-onboarding-modal]');
		if (!modal) return;

		focusableElements = Array.from(
			modal.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])')
		) as HTMLElement[];
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!show) return;

		if (event.key === 'Escape') {
			dismiss();
			return;
		}

		if (event.key === 'Tab') {
			if (focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

			if (event.shiftKey) {
				const nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
				focusableElements[nextIndex]?.focus();
			} else {
				const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
				focusableElements[nextIndex]?.focus();
			}

			event.preventDefault();
		}
	}

	function dismiss() {
		onDismiss();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			dismiss();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
		<div
			class="modal"
			data-onboarding-modal
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<button class="close-button" onclick={dismiss} aria-label="Close modal"> × </button>

			<h2 id="modal-title">Hapticpad Configurator (Prototype)</h2>

			<div class="credit-section">
				<p>Built for CNCDan's Hapticpad project.</p>
				<a
					href="https://github.com/dmcke5/Hapticpad"
					target="_blank"
					rel="noopener noreferrer"
					class="github-link"
				>
					dmcke5/Hapticpad
				</a>
			</div>

			<div class="how-it-works">
				<h3>How it works:</h3>
				<ul>
					<li>Import a ZIP (config.xml + profile icon folders) or import XML only</li>
					<li>Select a profile in the sidebar to edit it</li>
					<li>Click a key (or the wheel) on the device preview to configure it</li>
					<li>Edit labels, action slots, and wheel mode/key</li>
					<li>Export ZIP for a full bundle or export XML only</li>
				</ul>
			</div>

			<div class="technical-note">
				<p>
					Icons are stored as <code>&lbrace;ProfileName&rbrace;/&lbrace;1..6&rbrace;.bmp</code> in ZIP
					exports.
				</p>
			</div>

			<div class="support-section">
				<p>If this tool is useful to you, consider buying me a coffee ☕</p>
				<a
					href="https://buymeacoffee.com/wayfindingdiogo"
					target="_blank"
					rel="noopener noreferrer"
					class="coffee-link"
				>
					Buy me a coffee
				</a>
			</div>

			<div class="modal-controls">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={dontShowAgain} />
					Don't show again this session
				</label>

				<button class="primary-button" onclick={dismiss} data-onboarding-button> Got it </button>
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
		background: rgba(0, 0, 0, 0.6);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.modal {
		background: white;
		border-radius: 12px;
		padding: 32px;
		max-width: 540px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
		position: relative;
	}

	.close-button {
		position: absolute;
		top: 16px;
		right: 16px;
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #718096;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #f7fafc;
		color: #4a5568;
	}

	h2 {
		margin: 0 0 24px 0;
		color: #2d3748;
		font-size: 24px;
		font-weight: 600;
		padding-right: 40px;
	}

	.credit-section {
		margin-bottom: 24px;
		padding: 16px;
		background: #f7fafc;
		border-radius: 8px;
		border-left: 4px solid #3182ce;
	}

	.credit-section p {
		margin: 0 0 8px 0;
		color: #4a5568;
		font-size: 14px;
	}

	.github-link {
		color: #3182ce;
		text-decoration: none;
		font-weight: 500;
		font-size: 14px;
	}

	.github-link:hover {
		text-decoration: underline;
	}

	.how-it-works {
		margin-bottom: 24px;
	}

	.how-it-works h3 {
		margin: 0 0 12px 0;
		color: #2d3748;
		font-size: 16px;
		font-weight: 600;
	}

	.how-it-works ul {
		margin: 0;
		padding-left: 20px;
		color: #4a5568;
		line-height: 1.6;
	}

	.how-it-works li {
		margin-bottom: 6px;
		font-size: 14px;
	}

	.technical-note {
		margin-bottom: 24px;
		padding: 12px 16px;
		background: #fffbf0;
		border-radius: 6px;
		border: 1px solid #fbd38d;
	}

	.technical-note p {
		margin: 0;
		color: #744210;
		font-size: 13px;
		font-style: italic;
	}

	.technical-note code {
		background: rgba(116, 66, 16, 0.1);
		padding: 2px 4px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 12px;
	}

	.support-section {
		margin-bottom: 32px;
		padding: 16px;
		background: #f0fff4;
		border-radius: 8px;
		border-left: 4px solid #48bb78;
		text-align: center;
	}

	.support-section p {
		margin: 0 0 12px 0;
		color: #2f855a;
		font-size: 14px;
	}

	.coffee-link {
		color: #2f855a;
		text-decoration: none;
		font-weight: 500;
		font-size: 14px;
	}

	.coffee-link:hover {
		text-decoration: underline;
	}

	.modal-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		border-top: 1px solid #e2e8f0;
		padding-top: 24px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #718096;
		font-size: 14px;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label input[type='checkbox'] {
		margin: 0;
		cursor: pointer;
	}

	.primary-button {
		background: #3182ce;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 14px;
		min-width: 100px;
	}

	.primary-button:hover {
		background: #2c5aa0;
		transform: translateY(-1px);
	}

	.primary-button:focus {
		outline: 2px solid #63b3ed;
		outline-offset: 2px;
	}

	@media (max-width: 600px) {
		.modal {
			margin: 10px;
			padding: 24px;
		}

		h2 {
			font-size: 20px;
			padding-right: 35px;
		}

		.modal-controls {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.checkbox-label {
			justify-content: center;
		}
	}
</style>
