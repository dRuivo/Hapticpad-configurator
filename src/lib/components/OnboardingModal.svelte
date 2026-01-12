<script lang="ts">
	import { onMount } from 'svelte';

	let showModal = $state(false);

	onMount(() => {
		// Check if user has seen the onboarding before
		const hasSeenOnboarding = localStorage.getItem('hapticpad-onboarding-shown');
		if (!hasSeenOnboarding) {
			showModal = true;
		}
	});

	function hideModal() {
		showModal = false;
		localStorage.setItem('hapticpad-onboarding-shown', 'true');
	}
</script>

{#if showModal}
	<div class="modal-backdrop">
		<div class="modal">
			<h2>Welcome to Hapticpad Configurator</h2>
			<p>This tool helps you configure your Hapticpad device. Here's how to get started:</p>

			<div class="steps">
				<div class="step">
					<strong>1. Import Configuration</strong>
					<p>Upload a ZIP file from your Hapticpad device or start with a blank configuration.</p>
				</div>

				<div class="step">
					<strong>2. Configure Keys & Wheel</strong>
					<p>Click any key or the wheel to configure its label, actions, and behavior.</p>
				</div>

				<div class="step">
					<strong>3. Action Slots</strong>
					<p>Each key has 3 action slots that can trigger different keycodes with custom delays.</p>
				</div>

				<div class="step">
					<strong>4. Export & Install</strong>
					<p>Export your configuration as a ZIP file and copy it to your Hapticpad device.</p>
				</div>
			</div>

			<div class="actions">
				<button onclick={hideModal} class="primary-button">Get Started</button>
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
		background: rgba(0, 0, 0, 0.5);
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
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	h2 {
		margin: 0 0 16px 0;
		color: #2d3748;
		font-size: 24px;
		font-weight: 600;
	}

	p {
		color: #4a5568;
		line-height: 1.6;
		margin-bottom: 24px;
	}

	.steps {
		margin-bottom: 32px;
	}

	.step {
		margin-bottom: 20px;
		padding: 16px;
		border-radius: 8px;
		background: #f7fafc;
		border-left: 4px solid #3498db;
	}

	.step:last-child {
		margin-bottom: 0;
	}

	.step strong {
		display: block;
		color: #2d3748;
		margin-bottom: 4px;
		font-weight: 600;
	}

	.step p {
		margin: 0;
		color: #718096;
		font-size: 14px;
	}

	.actions {
		display: flex;
		justify-content: center;
	}

	.primary-button {
		background: #3498db;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 16px;
	}

	.primary-button:hover {
		background: #2980b9;
		transform: translateY(-1px);
	}
</style>
