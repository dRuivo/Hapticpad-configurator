<script lang="ts">
	import MacropadSvg from '$lib/components/MacropadSvg.svelte';
	import KeyConfigPanel from '$lib/components/KeyConfigPanel.svelte';

	// App state
	let selectedKey = $state(0);
	let labels = $state(['', '', '', '', '', '']);

	function handleKeySelect(keyIndex: number) {
		selectedKey = keyIndex;
	}

	function handleLabelChange(value: string) {
		labels[selectedKey] = value;
	}
</script>

<svelte:head>
	<title>Haptic Macro Pad Configurator</title>
	<meta name="description" content="Configure your haptic macro pad" />
</svelte:head>

<main class="container">
	<header>
		<h1>Haptic Macro Pad Configurator</h1>
		<p>Select a key to configure its label and keybind</p>
	</header>

	<div class="content">
		<div class="macropad-section">
			<h2>Device</h2>
			<MacropadSvg {selectedKey} onSelect={handleKeySelect} {labels} />
		</div>

		<div class="config-section">
			<h2>Configuration</h2>
			<KeyConfigPanel {selectedKey} label={labels[selectedKey]} onLabelChange={handleLabelChange} />
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f8f9fa;
		color: #333;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100vh;
	}

	header {
		text-align: center;
		margin-bottom: 40px;
	}

	header h1 {
		margin: 0 0 10px 0;
		font-size: 2.5rem;
		color: #333;
		font-weight: 700;
	}

	header p {
		margin: 0;
		font-size: 1.1rem;
		color: #666;
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: start;
	}

	.macropad-section h2,
	.config-section h2 {
		margin: 0 0 20px 0;
		font-size: 1.5rem;
		color: #333;
		text-align: center;
	}

	/* Responsive layout */
	@media (max-width: 768px) {
		.container {
			padding: 15px;
		}

		header h1 {
			font-size: 2rem;
		}

		.content {
			grid-template-columns: 1fr;
			gap: 30px;
		}

		.macropad-section h2,
		.config-section h2 {
			font-size: 1.3rem;
		}
	}

	@media (max-width: 480px) {
		.container {
			padding: 10px;
		}

		header h1 {
			font-size: 1.8rem;
		}

		header p {
			font-size: 1rem;
		}
	}
</style>
