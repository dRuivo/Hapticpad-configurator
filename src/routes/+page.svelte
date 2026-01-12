<script lang="ts">
	import MacropadSvg from '$lib/components/MacropadSvg.svelte';
	import KeyConfigPanel from '$lib/components/KeyConfigPanel.svelte';
	import ProfilesSidebar from '$lib/components/ProfilesSidebar.svelte';
	import ImportPreviewModal from '$lib/components/ImportPreviewModal.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';
	import type {
		SelectedTarget,
		Profile,
		AppState,
		ImportPreview,
		WheelMode,
		ActionSlot
	} from '$lib/model/types';
	import { isKeySelected, createEmptyProfile, generateId } from '$lib/model/types';
	import {
		importConfigZip,
		exportConfigZip,
		exportConfigXml,
		downloadBlob,
		importConfigXmlOnly,
		createZipImportPreview
	} from '$lib/io/configZip';

	// Initialize app state
	const initialProfile = createEmptyProfile('Profile 1');
	let appState = $state<AppState>({
		profiles: [initialProfile],
		selectedProfileId: initialProfile.id,
		selectedTarget: { kind: 'key', index: 0 },
		isDirty: false
	});

	// Status messages
	type StatusType = 'success' | 'error' | 'warning';
	interface StatusMessage {
		type: StatusType;
		message: string;
		details?: string[];
	}
	let statusMessage = $state<StatusMessage | null>(null);
	let zipFileInput: HTMLInputElement;
	let xmlFileInput: HTMLInputElement;

	// Import preview modal state
	let importPreview = $state<ImportPreview | null>(null);
	let pendingImport = $state<{ type: 'zip' | 'xml'; preview: ImportPreview } | null>(null);

	// Auto-rename state for duplicated profiles
	let triggerRename = $state<string | null>(null);

	// Onboarding modal state
	let showOnboardingModal = $state(true);

	// Computed values
	const selectedProfile = $derived(
		appState.profiles.find((p) => p.id === appState.selectedProfileId) || appState.profiles[0]
	);
	const labels = $derived(selectedProfile?.keys.map((k) => k.label) || []);
	const icons = $derived(selectedProfile?.keys.map((k) => k.icon || '') || []);

	// Mark as dirty whenever app state changes (except isDirty itself)
	$effect(() => {
		// Watch for changes in profiles, selectedProfileId, or selectedTarget
		appState.profiles;
		appState.selectedProfileId;
		appState.selectedTarget;

		// Always mark dirty when these change
		appState.isDirty = true;
	});

	// Clear triggerRename after a short delay to allow the effect to be processed
	$effect(() => {
		const currentTrigger = triggerRename;
		if (currentTrigger) {
			setTimeout(() => {
				if (triggerRename === currentTrigger) {
					triggerRename = null;
				}
			}, 100);
		}
	});

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

	// Wheel configuration handlers
	function handleWheelModeChange(mode: string) {
		if (selectedProfile) {
			const updatedProfile = { ...selectedProfile, wheelMode: mode as WheelMode };
			appState.profiles = appState.profiles.map((p) =>
				p.id === selectedProfile.id ? updatedProfile : p
			);
		}
	}

	function handleWheelKeyChange(keycode: number) {
		if (selectedProfile) {
			const updatedProfile = { ...selectedProfile, wheelKey: keycode };
			appState.profiles = appState.profiles.map((p) =>
				p.id === selectedProfile.id ? updatedProfile : p
			);
		}
	}

	// Action slot handlers
	function handleActionChange(actionIndex: number, action: ActionSlot) {
		if (isKeySelected(appState.selectedTarget) && selectedProfile) {
			const keyIndex = appState.selectedTarget.index;
			const updatedKey = { ...selectedProfile.keys[keyIndex] };

			// Ensure actions array exists and has proper length
			if (!updatedKey.actions) {
				updatedKey.actions = [null, null, null];
			}

			// Update the specific action
			updatedKey.actions[actionIndex] = action;
			// Update the profile
			const updatedProfile = {
				...selectedProfile,
				keys: selectedProfile.keys.map((key, i) => (i === keyIndex ? updatedKey : key))
			};

			appState.profiles = appState.profiles.map((p) =>
				p.id === selectedProfile.id ? updatedProfile : p
			);
		}
	}

	function handleActionClear(actionIndex: number) {
		if (isKeySelected(appState.selectedTarget) && selectedProfile) {
			const keyIndex = appState.selectedTarget.index;
			const updatedKey = { ...selectedProfile.keys[keyIndex] };

			if (updatedKey.actions) {
				updatedKey.actions[actionIndex] = null;

				// Update the profile
				const updatedProfile = {
					...selectedProfile,
					keys: selectedProfile.keys.map((key, i) => (i === keyIndex ? updatedKey : key))
				};

				appState.profiles = appState.profiles.map((p) =>
					p.id === selectedProfile.id ? updatedProfile : p
				);
			}
		}
	}

	// Capture handlers
	function handleWheelKeyCaptured(keycode: number) {
		// Already handled by onWheelKeyChange
		setStatus('success', `Wheel key captured: ${keycode}`);
	}

	function handleActionCaptured(actionIndex: number, action: ActionSlot) {
		// Already handled by onActionChange
		setStatus('success', `Action ${actionIndex + 1} captured: keycode ${action.keycode}`);
	}

	function handleActionChordCaptured(
		actions: [ActionSlot | null, ActionSlot | null, ActionSlot | null]
	) {
		// Already handled by onActionChange for each slot
		const keycodes = actions.map((a) => a?.keycode ?? '—').join(', ');
		setStatus('success', `Key chord captured: [${keycodes}]`);
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

	function generateDuplicateName(baseName: string): string {
		const names = new Set(appState.profiles.map((p) => p.name));
		let duplicateName = `${baseName} (copy)`;
		let counter = 2;

		while (names.has(duplicateName)) {
			duplicateName = `${baseName} (copy ${counter})`;
			counter++;
		}

		return duplicateName;
	}

	function duplicateProfile(id: string): Profile {
		const profileToDuplicate = appState.profiles.find((p) => p.id === id);
		if (!profileToDuplicate) {
			throw new Error('Profile not found');
		}

		// Deep clone the profile with new ID and name
		const duplicatedKeys = profileToDuplicate.keys.map((key) => {
			let duplicatedBmp: typeof key.bmp = undefined;

			if (key.bmp) {
				if (key.bmp instanceof Uint8Array) {
					duplicatedBmp = new Uint8Array(key.bmp);
				} else if (key.bmp instanceof ArrayBuffer) {
					duplicatedBmp = key.bmp.slice(0);
				} else if (key.bmp instanceof Blob) {
					// For Blob, we keep the reference since Blob is immutable
					duplicatedBmp = key.bmp;
				} else {
					duplicatedBmp = key.bmp;
				}
			}

			return {
				...key,
				bmp: duplicatedBmp
			};
		});

		const duplicatedProfile: Profile = {
			id: generateId(),
			name: generateDuplicateName(profileToDuplicate.name),
			wheelMode: profileToDuplicate.wheelMode,
			wheelKey: profileToDuplicate.wheelKey,
			keys: duplicatedKeys,
			wheelModeXml: profileToDuplicate.wheelModeXml,
			wheelKeyXml: profileToDuplicate.wheelKeyXml
		};

		return duplicatedProfile;
	}

	function handleDuplicateProfile(id: string) {
		if (appState.profiles.length >= 128) return;

		try {
			const duplicatedProfile = duplicateProfile(id);

			// Add the duplicated profile after the original
			const originalIndex = appState.profiles.findIndex((p) => p.id === id);
			const newProfiles = [...appState.profiles];
			newProfiles.splice(originalIndex + 1, 0, duplicatedProfile);

			appState.profiles = newProfiles;
			appState.selectedProfileId = duplicatedProfile.id;

			// Trigger auto-rename for the duplicated profile
			triggerRename = duplicatedProfile.id;

			setStatus('success', `Profile "${duplicatedProfile.name}" created successfully`);
		} catch (error) {
			setStatus(
				'error',
				`Failed to duplicate profile: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// Import/Export handlers
	function clearStatus() {
		statusMessage = null;
	}

	function setStatus(type: StatusType, message: string, details?: string[]) {
		statusMessage = { type, message, details };
		// Auto-clear success messages after 5 seconds
		if (type === 'success') {
			setTimeout(() => {
				if (statusMessage?.type === 'success') {
					statusMessage = null;
				}
			}, 5000);
		}
	}

	function handleImportZipClick() {
		zipFileInput.click();
	}

	function handleImportXmlClick() {
		xmlFileInput.click();
	}

	async function handleZipFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];

		try {
			clearStatus();
			const preview = await createZipImportPreview(file);
			pendingImport = { type: 'zip', preview };
			importPreview = preview;
		} catch (error) {
			setStatus('error', error instanceof Error ? error.message : 'Import failed');
		} finally {
			input.value = '';
		}
	}

	async function handleXmlFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];

		try {
			clearStatus();
			const preview = await importConfigXmlOnly(file);
			pendingImport = { type: 'xml', preview };
			importPreview = preview;
		} catch (error) {
			setStatus('error', error instanceof Error ? error.message : 'Import failed');
		} finally {
			input.value = '';
		}
	}

	function confirmImport() {
		if (!pendingImport) return;

		// Update app state with preview data
		appState = {
			...pendingImport.preview.state,
			isDirty: false // Mark as clean since we just imported
		};

		// Show success message
		const { preview } = pendingImport;
		if (preview.warnings.length > 0) {
			setStatus(
				'warning',
				`Imported ${preview.profileCount} profile(s) with ${preview.warnings.length} warning(s)`,
				preview.warnings
			);
		} else {
			setStatus('success', `Successfully imported ${preview.profileCount} profile(s)`);
		}

		// Clear modal state
		importPreview = null;
		pendingImport = null;
	}

	function cancelImport() {
		importPreview = null;
		pendingImport = null;
	}

	async function handleExportZip() {
		try {
			clearStatus();
			const { blob, warnings } = await exportConfigZip(appState);

			downloadBlob(blob, 'macropad-config.zip');

			// Mark as clean after successful export
			appState.isDirty = false;

			if (warnings.length > 0) {
				setStatus('warning', 'ZIP exported with warnings', warnings);
			} else {
				setStatus('success', 'ZIP configuration exported successfully');
			}
		} catch (error) {
			setStatus('error', error instanceof Error ? error.message : 'Export failed');
		}
	}

	// Onboarding modal handlers
	function handleOnboardingDismiss() {
		showOnboardingModal = false;
	}

	async function handleExportXml() {
		try {
			clearStatus();
			const { blob, warnings } = await exportConfigXml(appState);

			downloadBlob(blob, 'macropad-config.xml');

			if (warnings.length > 0) {
				setStatus('warning', 'XML exported with warnings', warnings);
			} else {
				setStatus('success', 'XML configuration exported successfully');
			}
		} catch (error) {
			setStatus('error', error instanceof Error ? error.message : 'Export failed');
		}
	}
</script>

<svelte:head>
	<title>Haptic Macro Pad Configurator</title>
	<meta name="description" content="Configure your haptic macro pad" />
</svelte:head>

<main class="container">
	<!-- Import/Export Header -->
	<header class="import-export-header">
		<div class="header-content">
			<div class="title-section">
				<h1>
					Haptic Macro Pad Configurator
					{#if appState.isDirty}
						<span class="dirty-indicator" title="Unsaved changes">●</span>
					{/if}
				</h1>
				<p>Select a component to configure its settings</p>
			</div>

			<div class="import-export-controls">
				<div class="import-group">
					<button class="import-button" onclick={handleImportZipClick}> 📁 Import ZIP </button>
					<button class="import-button secondary" onclick={handleImportXmlClick}>
						📄 Import XML
					</button>
				</div>
				<div class="export-group">
					<button class="export-button" onclick={handleExportZip}> 📦 Export ZIP </button>
					<button class="export-button secondary" onclick={handleExportXml}> 📄 Export XML </button>
				</div>
			</div>
		</div>

		<!-- Status area -->
		{#if statusMessage}
			<div class="status-area status-{statusMessage.type}">
				<div class="status-content">
					<span class="status-message">{statusMessage.message}</span>
					<button class="status-close" onclick={clearStatus}>×</button>
				</div>
				{#if statusMessage.details && statusMessage.details.length > 0}
					<div class="status-details">
						{#each statusMessage.details.slice(0, 3) as detail}
							<div class="status-detail">• {detail}</div>
						{/each}
						{#if statusMessage.details.length > 3}
							<div class="status-detail">• and {statusMessage.details.length - 3} more...</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Hidden file inputs -->
	<input
		bind:this={zipFileInput}
		type="file"
		accept=".zip"
		onchange={handleZipFileChange}
		style="display: none;"
	/>
	<input
		bind:this={xmlFileInput}
		type="file"
		accept=".xml,.txt"
		onchange={handleXmlFileChange}
		style="display: none;"
	/>

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
			onDuplicateProfile={handleDuplicateProfile}
			{triggerRename}
		/>

		<!-- Device preview -->
		<div class="macropad-section">
			<h2>Device Preview</h2>
			<MacropadSvg
				selectedTarget={appState.selectedTarget}
				{labels}
				{icons}
				profile={selectedProfile}
				onSelectWheel={handleWheelSelect}
				onSelectKey={handleKeySelect}
				onIconDecodeError={(error) => setStatus('error', `Icon decode error: ${error}`)}
			/>
		</div>

		<!-- Configuration panel -->
		<div class="config-section">
			<h2>Configuration</h2>
			<KeyConfigPanel
				selectedTarget={appState.selectedTarget}
				profile={selectedProfile}
				label={getCurrentLabel()}
				onLabelChange={handleLabelChange}
				onWheelModeChange={handleWheelModeChange}
				onWheelKeyChange={handleWheelKeyChange}
				onActionChange={handleActionChange}
				onActionClear={handleActionClear}
				onWheelKeyCaptured={handleWheelKeyCaptured}
				onActionCaptured={handleActionCaptured}
				onActionChordCaptured={handleActionChordCaptured}
			/>
		</div>
	</div>
</main>

<!-- Import preview modal -->
<ImportPreviewModal preview={importPreview} onConfirm={confirmImport} onCancel={cancelImport} />

<!-- Onboarding modal -->
<OnboardingModal show={showOnboardingModal} onDismiss={handleOnboardingDismiss} />

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

	.import-export-header {
		background: #fff;
		border-bottom: 2px solid #e2e8f0;
		flex-shrink: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		max-width: 1400px;
		margin: 0 auto;
		gap: 20px;
	}

	.title-section {
		flex: 1;
	}

	.title-section h1 {
		margin: 0 0 5px 0;
		font-size: 1.8rem;
		color: #2d3748;
		font-weight: 700;
	}

	.title-section p {
		margin: 0;
		font-size: 0.9rem;
		color: #718096;
	}

	h1 {
		margin: 0;
		font-size: 1.8rem;
		color: #2c3e50;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dirty-indicator {
		color: #e74c3c;
		font-size: 1.2rem;
		animation: pulse 2s infinite;
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

	.import-export-controls {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.import-group,
	.export-group {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.import-button,
	.export-button {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 120px;
		justify-content: center;
	}

	.import-button {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
	}

	.import-button:hover {
		background: linear-gradient(135deg, #2980b9 0%, #1f6ba6 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(52, 152, 219, 0.4);
	}

	.import-button.secondary {
		background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
		box-shadow: 0 2px 4px rgba(149, 165, 166, 0.3);
	}

	.import-button.secondary:hover {
		background: linear-gradient(135deg, #7f8c8d 0%, #6c7b7b 100%);
		box-shadow: 0 4px 8px rgba(149, 165, 166, 0.4);
	}

	.export-button {
		background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
		color: white;
		box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
	}

	.export-button:hover {
		background: linear-gradient(135deg, #229954 0%, #1e7e34 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(39, 174, 96, 0.4);
	}

	.export-button.secondary {
		background: linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%);
		box-shadow: 0 2px 4px rgba(142, 68, 173, 0.3);
	}

	.export-button.secondary:hover {
		background: linear-gradient(135deg, #7d3c98 0%, #6c3483 100%);
		box-shadow: 0 4px 8px rgba(142, 68, 173, 0.4);
	}

	/* Status area styles */
	.status-area {
		padding: 12px 20px;
		margin: 0;
		border-top: 1px solid #e2e8f0;
		animation: slideDown 0.3s ease;
	}

	.status-success {
		background: #d4edda;
		color: #155724;
		border-left: 4px solid #28a745;
	}

	.status-error {
		background: #f8d7da;
		color: #721c24;
		border-left: 4px solid #dc3545;
	}

	.status-warning {
		background: #fff3cd;
		color: #856404;
		border-left: 4px solid #ffc107;
	}

	.status-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.status-message {
		font-weight: 600;
		flex: 1;
	}

	.status-close {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s ease;
		color: inherit;
	}

	.status-close:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.status-details {
		margin-top: 8px;
		font-size: 13px;
		opacity: 0.9;
	}

	.status-detail {
		margin: 2px 0;
	}

	@keyframes slideDown {
		from {
			max-height: 0;
			opacity: 0;
		}
		to {
			max-height: 200px;
			opacity: 1;
		}
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
		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
			padding: 16px;
		}

		.title-section {
			text-align: center;
		}

		.title-section h1 {
			font-size: 1.6rem;
		}

		.import-export-controls {
			justify-content: center;
			flex-wrap: wrap;
		}

		.import-button,
		.export-button {
			min-width: 120px;
			font-size: 13px;
			padding: 8px 12px;
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
	}

	@media (max-width: 480px) {
		.title-section h1 {
			font-size: 1.5rem;
		}

		.title-section p {
			font-size: 0.85rem;
		}

		.import-export-controls {
			flex-direction: column;
		}

		.import-button,
		.export-button {
			width: 100%;
			min-width: auto;
		}
	}
</style>
