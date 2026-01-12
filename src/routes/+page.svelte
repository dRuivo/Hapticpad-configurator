<script lang="ts">
	import MacropadSvg from '$lib/components/MacropadSvg.svelte';
	import KeyConfigPanel from '$lib/components/KeyConfigPanel.svelte';
	import ProfilesSidebar from '$lib/components/ProfilesSidebar.svelte';
	import type { SelectedTarget, Profile, AppState } from '$lib/model/types';
	import { isKeySelected, createEmptyProfile, generateId } from '$lib/model/types';

	// Initialize app state
	const initialProfile = createEmptyProfile('Profile 1');
	let appState = $state<AppState>({
		profiles: [initialProfile],
		selectedProfileId: initialProfile.id,
		selectedTarget: { kind: 'key', index: 0 }
	});

	// Computed values
	const selectedProfile = $derived(
		appState.profiles.find((p) => p.id === appState.selectedProfileId) || appState.profiles[0]
	);
	const labels = $derived(selectedProfile?.keys.map((k) => k.label) || []);
	const icons = $derived(selectedProfile?.keys.map((k) => k.icon || '') || []);

	function handleWheelSelect() {
		appState.selectedTarget = { kind: 'wheel' };
	}

	function handleKeySelect(index: number) {
		appState.selectedTarget = { kind: 'key', index };
	}

	function handleLabelChange(value: string) {
		if (isKeySelected(appState.selectedTarget) && selectedProfile) {
			const keyIndex = appState.selectedTarget.index;
			// Create new profile with updated key
			const updatedProfile = {
				...selectedProfile,
				keys: selectedProfile.keys.map((key, i) =>
					i === keyIndex ? { ...key, label: value } : key
				)
			};
			// Update profiles array
			appState.profiles = appState.profiles.map((p) =>
				p.id === selectedProfile.id ? updatedProfile : p
			);
		}
	}

	function getCurrentLabel(): string {
		if (isKeySelected(appState.selectedTarget) && selectedProfile) {
			return selectedProfile.keys[appState.selectedTarget.index]?.label || '';
		}
		return '';
	}

	// Profile management handlers
	function handleSelectProfile(id: string) {
		appState.selectedProfileId = id;
	}

	function handleAddProfile() {
		if (appState.profiles.length >= 128) return;

		const newProfile = createEmptyProfile(`Profile ${appState.profiles.length + 1}`);
		appState.profiles = [...appState.profiles, newProfile];
		appState.selectedProfileId = newProfile.id;
	}

	function handleRemoveProfile(id: string) {
		if (appState.profiles.length <= 1) return;

		const currentIndex = appState.profiles.findIndex((p) => p.id === id);
		const newProfiles = appState.profiles.filter((p) => p.id !== id);

		// Select neighbor profile if we're removing the selected one
		if (id === appState.selectedProfileId) {
			const newSelectedIndex = Math.min(currentIndex, newProfiles.length - 1);
			appState.selectedProfileId = newProfiles[newSelectedIndex].id;
		}

		appState.profiles = newProfiles;
	}

	function handleRenameProfile(id: string, newName: string) {
		appState.profiles = appState.profiles.map((p) => (p.id === id ? { ...p, name: newName } : p));
	}

	function handleMoveProfile(id: string, direction: 'up' | 'down') {
		const currentIndex = appState.profiles.findIndex((p) => p.id === id);
		if (currentIndex === -1) return;

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		if (newIndex < 0 || newIndex >= appState.profiles.length) return;

		const newProfiles = [...appState.profiles];
		[newProfiles[currentIndex], newProfiles[newIndex]] = [
			newProfiles[newIndex],
			newProfiles[currentIndex]
		];
		appState.profiles = newProfiles;
	}
</script>

<svelte:head>
	<title>Haptic Macro Pad Configurator</title>
	<meta name="description" content="Configure your haptic macro pad" />
</svelte:head>

<main class="container">
	<header>
		<h1>Haptic Macro Pad Configurator</h1>
		<p>Select a component to configure its settings</p>
	</header>

	<div class="content">
		<!-- Profiles sidebar -->
		<ProfilesSidebar
			profiles={appState.profiles}
			selectedProfileId={appState.selectedProfileId}
			onSelectProfile={handleSelectProfile}
			onAddProfile={handleAddProfile}
			onRemoveProfile={handleRemoveProfile}
			onRenameProfile={handleRenameProfile}
			onMoveProfile={handleMoveProfile}
		/>

		<!-- Device preview -->
		<div class="macropad-section">
			<h2>Device Preview</h2>
			<MacropadSvg
				selectedTarget={appState.selectedTarget}
				{labels}
				{icons}
				onSelectWheel={handleWheelSelect}
				onSelectKey={handleKeySelect}
			/>
		</div>

		<!-- Configuration panel -->
		<div class="config-section">
			<h2>Configuration</h2>
			<KeyConfigPanel
				selectedTarget={appState.selectedTarget}
				label={getCurrentLabel()}
				onLabelChange={handleLabelChange}
			/>
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
		max-width: none;
		margin: 0;
		padding: 0;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		text-align: center;
		padding: 20px;
		background: #f8f9fa;
		border-bottom: 1px solid #e2e8f0;
		flex-shrink: 0;
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
		grid-template-columns: auto 1fr 1fr;
		gap: 0;
		align-items: start;
		height: 100vh;
	}

	.macropad-section,
	.config-section {
		padding: 20px;
		height: 100vh;
		overflow-y: auto;
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
			padding: 0;
		}

		.content {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto 1fr;
			height: auto;
		}

		.macropad-section,
		.config-section {
			height: auto;
			padding: 15px;
		}

		header {
			padding: 15px;
			margin-bottom: 0;
		}

		header h1 {
			font-size: 1.8rem;
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
