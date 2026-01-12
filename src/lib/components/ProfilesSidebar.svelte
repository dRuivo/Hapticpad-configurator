<script lang="ts">
	import type { Profile } from '$lib/model/types';
	import { hasUnsafeProfileName } from '$lib/model/types';
	import ConfirmModal from './ConfirmModal.svelte';

	interface Props {
		profiles: Profile[];
		selectedProfileId: string;
		onSelectProfile: (id: string) => void;
		onAddProfile: () => void;
		onRemoveProfile: (id: string) => void;
		onRenameProfile: (id: string, newName: string) => void;
		onMoveProfile: (id: string, direction: 'up' | 'down') => void;
		onDuplicateProfile: (id: string) => void;
		triggerRename?: string | null; // Profile ID that should enter rename mode
	}

	let {
		profiles,
		selectedProfileId,
		onSelectProfile,
		onAddProfile,
		onRemoveProfile,
		onRenameProfile,
		onMoveProfile,
		onDuplicateProfile,
		triggerRename
	}: Props = $props();

	let editingProfileId = $state<string | null>(null);
	let editingName = $state('');

	// Confirmation modal state
	let confirmModal = $state({
		isOpen: false,
		profileId: '',
		profileName: ''
	});

	function handleProfileClick(profileId: string, event: Event) {
		// Don't select if clicking on interactive controls
		const target = event.target as HTMLElement;
		if (
			target.closest('button') ||
			target.closest('input') ||
			target.classList.contains('profile-name-editing')
		) {
			return;
		}
		onSelectProfile(profileId);
	}

	function startEditing(profile: Profile, event: Event) {
		event.stopPropagation();
		editingProfileId = profile.id;
		editingName = profile.name;
		// Focus the input after state update
		setTimeout(() => {
			const input = document.querySelector('.name-input') as HTMLInputElement;
			if (input) input.focus();
		}, 0);
	}

	function commitEdit() {
		if (editingProfileId && editingName.trim()) {
			onRenameProfile(editingProfileId, editingName.trim());
		}
		cancelEdit();
	}

	function cancelEdit() {
		editingProfileId = null;
		editingName = '';
	}

	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	function handleEditBlur() {
		// Small delay to allow for other actions before committing
		setTimeout(commitEdit, 10);
	}

	function getProfileIndex(profileId: string): number {
		return profiles.findIndex((p) => p.id === profileId);
	}

	function canMoveUp(profileId: string): boolean {
		return getProfileIndex(profileId) > 0;
	}

	function canMoveDown(profileId: string): boolean {
		const index = getProfileIndex(profileId);
		return index >= 0 && index < profiles.length - 1;
	}

	function handleMove(profileId: string, direction: 'up' | 'down') {
		onMoveProfile(profileId, direction);
	}

	function requestRemove(profile: Profile, event: Event) {
		event.stopPropagation();
		if (profiles.length <= 1) return;

		confirmModal = {
			isOpen: true,
			profileId: profile.id,
			profileName: profile.name
		};
	}

	function confirmRemove() {
		if (confirmModal.profileId) {
			onRemoveProfile(confirmModal.profileId);
		}
		confirmModal.isOpen = false;
	}

	function cancelRemove() {
		confirmModal.isOpen = false;
	}

	function handleDuplicate(profile: Profile, event: Event) {
		event.stopPropagation();
		if (!canAddProfile) return;
		onDuplicateProfile(profile.id);
	}

	function getBitmapCount(profile: Profile): number {
		return profile.keys.filter((key) => key.bmp).length;
	}

	const maxProfiles = 128;
	const canAddProfile = $derived(profiles.length < maxProfiles);
	const canRemoveProfile = $derived(profiles.length > 1);

	// Handle triggerRename to auto-enter edit mode
	$effect(() => {
		if (triggerRename) {
			const profile = profiles.find((p) => p.id === triggerRename);
			if (profile) {
				editingProfileId = profile.id;
				editingName = profile.name;
				// Focus the input after state update
				setTimeout(() => {
					const input = document.querySelector('.name-input') as HTMLInputElement;
					if (input) {
						input.focus();
						input.select(); // Select all text for easy editing
					}
				}, 0);
			}
		}
	});
</script>

<aside class="profiles-sidebar">
	<header class="sidebar-header">
		<h2>Profiles</h2>
		<button
			class="add-button"
			onclick={onAddProfile}
			disabled={!canAddProfile}
			aria-label="Add new profile"
		>
			<span class="plus-icon">+</span>
		</button>
	</header>

	{#if !canAddProfile}
		<p class="max-profiles-hint">Max 128 profiles</p>
	{/if}

	<div class="profiles-list">
		{#each profiles as profile, index (profile.id)}
			<div
				class="profile-row {selectedProfileId === profile.id ? 'selected' : ''}"
				onclick={(e) => handleProfileClick(profile.id, e)}
				onkeydown={(e) => e.key === 'Enter' && handleProfileClick(profile.id, e)}
				role="button"
				tabindex="0"
				aria-label="Select profile {profile.name}"
			>
				<!-- Selected indicator -->
				{#if selectedProfileId === profile.id}
					<div class="selected-indicator"></div>
					<span class="selected-badge">Selected</span>
				{/if}

				<!-- Profile name (editable) -->
				<div class="profile-name">
					{#if editingProfileId === profile.id}
						<input
							type="text"
							class="name-input"
							bind:value={editingName}
							onkeydown={handleEditKeydown}
							onblur={handleEditBlur}
							aria-label="Edit profile name"
						/>
						{#if hasUnsafeProfileName(editingName)}
							<div class="unsafe-name-warning">⚠️ Name contains unsafe characters for export</div>
						{/if}
					{:else}
						<span
							class="name-text"
							onclick={(e) => startEditing(profile, e)}
							onkeydown={(e) => e.key === 'Enter' && startEditing(profile, e)}
							role="button"
							tabindex="0"
							aria-label="Click to edit profile name"
						>
							{profile.name}
							{#if hasUnsafeProfileName(profile.name)}
								<span class="unsafe-indicator" title="Unsafe characters for export">⚠️</span>
							{/if}
						</span>
					{/if}

					<!-- Bitmap count indicator -->
					<div class="bitmap-indicator" class:has-bitmaps={getBitmapCount(profile) > 0}>
						{getBitmapCount(profile)}/6
					</div>
				</div>

				<!-- Action buttons -->
				<div class="profile-actions">
					<!-- Move up/down -->
					<button
						class="move-button"
						onclick={() => handleMove(profile.id, 'up')}
						disabled={!canMoveUp(profile.id)}
						aria-label="Move profile up"
						title="Move up"
					>
						<span class="arrow">↑</span>
					</button>
					<button
						class="move-button"
						onclick={() => handleMove(profile.id, 'down')}
						disabled={!canMoveDown(profile.id)}
						aria-label="Move profile down"
						title="Move down"
					>
						<span class="arrow">↓</span>
					</button>

					<!-- Duplicate button -->
					<button
						class="duplicate-button"
						onclick={(e) => handleDuplicate(profile, e)}
						disabled={!canAddProfile}
						aria-label="Duplicate profile"
						title="Duplicate profile"
					>
						<span class="duplicate-icon">⧉</span>
					</button>

					<!-- Remove button -->
					<button
						class="remove-button"
						onclick={(e) => requestRemove(profile, e)}
						disabled={!canRemoveProfile}
						aria-label="Remove profile"
						title="Remove profile"
					>
						<span class="remove-icon">×</span>
					</button>
				</div>
			</div>
		{/each}
	</div>
</aside>

<!-- Confirmation modal for profile removal -->
<ConfirmModal
	isOpen={confirmModal.isOpen}
	title="Remove Profile"
	message="Are you sure you want to remove the profile '{confirmModal.profileName}'? This action cannot be undone."
	confirmText="Remove"
	cancelText="Cancel"
	variant="danger"
	onConfirm={confirmRemove}
	onCancel={cancelRemove}
/>

<style>
	.profiles-sidebar {
		width: 280px;
		background: #fff;
		border-right: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow-y: auto;
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #e2e8f0;
		background: #f8f9fa;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.4rem;
		color: #2d3748;
		font-weight: 600;
	}

	.add-button {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: 2px solid #3498db;
		background: #3498db;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 18px;
		font-weight: bold;
	}

	.add-button:hover:not(:disabled) {
		background: #2980b9;
		border-color: #2980b9;
		transform: translateY(-1px);
	}

	.add-button:disabled {
		background: #bdc3c7;
		border-color: #bdc3c7;
		cursor: not-allowed;
		transform: none;
	}

	.plus-icon {
		line-height: 1;
	}

	.max-profiles-hint {
		padding: 8px 20px;
		margin: 0;
		font-size: 12px;
		color: #e67e22;
		background: #fef5e7;
		border-bottom: 1px solid #f4d03f;
		font-style: italic;
	}

	.profiles-list {
		flex: 1;
		overflow-y: auto;
	}

	.profile-row {
		position: relative;
		padding: 12px 20px;
		border-bottom: 1px solid #f1f5f9;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 60px;
	}

	.profile-row:hover {
		background: #f8f9fa;
	}

	.profile-row.selected {
		background: #e8f4fd;
		border-left: 4px solid #3498db;
		padding-left: 16px;
	}

	.selected-indicator {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: #3498db;
	}

	.selected-badge {
		background: #3498db;
		color: white;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.profile-name {
		flex: 1;
		min-width: 0;
		position: relative;
	}

	.name-text {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
		color: #2d3748;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
		word-break: break-word;
	}

	.name-text:hover {
		background: rgba(52, 152, 219, 0.1);
	}

	.unsafe-indicator {
		color: #f39c12;
		font-size: 12px;
	}

	.name-input {
		width: 100%;
		padding: 4px 8px;
		border: 2px solid #3498db;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		background: white;
		outline: none;
	}

	.unsafe-name-warning {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
		padding: 6px 8px;
		font-size: 11px;
		color: #856404;
		z-index: 10;
		margin-top: 2px;
	}

	.bitmap-indicator {
		background: #f5f5f5;
		color: #999;
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 3px;
		font-weight: 600;
		min-width: 24px;
		text-align: center;
	}

	.bitmap-indicator.has-bitmaps {
		background: #e8f5e8;
		color: #2d5a3d;
	}

	.profile-actions {
		display: flex;
		gap: 4px;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.profile-row:hover .profile-actions {
		opacity: 1;
	}

	.move-button,
	.remove-button,
	.duplicate-button {
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		font-size: 14px;
	}

	.move-button {
		background: #ecf0f1;
		color: #34495e;
	}

	.move-button:hover:not(:disabled) {
		background: #bdc3c7;
		transform: translateY(-1px);
	}

	.move-button:disabled {
		background: #f8f9fa;
		color: #bdc3c7;
		cursor: not-allowed;
		transform: none;
	}

	.duplicate-button {
		background: #9b59b6;
		color: white;
	}

	.duplicate-button:hover:not(:disabled) {
		background: #8e44ad;
		transform: translateY(-1px);
	}

	.duplicate-button:disabled {
		background: #ecf0f1;
		color: #bdc3c7;
		cursor: not-allowed;
		transform: none;
	}

	.remove-button {
		background: #e74c3c;
		color: white;
	}

	.remove-button:hover:not(:disabled) {
		background: #c0392b;
		transform: translateY(-1px);
	}

	.remove-button:disabled {
		background: #ecf0f1;
		color: #bdc3c7;
		cursor: not-allowed;
		transform: none;
	}

	.duplicate-button {
		background: #9b59b6;
		color: white;
	}

	.duplicate-button:hover:not(:disabled) {
		background: #8e44ad;
		transform: translateY(-1px);
	}

	.duplicate-button:disabled {
		background: #ecf0f1;
		color: #bdc3c7;
		cursor: not-allowed;
		transform: none;
	}

	.arrow {
		line-height: 1;
		font-weight: bold;
	}

	.remove-icon {
		line-height: 1;
		font-weight: bold;
		font-size: 16px;
	}

	.duplicate-icon {
		line-height: 1;
		font-weight: normal;
		font-size: 14px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.profiles-sidebar {
			width: 100%;
			height: auto;
			max-height: 300px;
		}
	}
</style>
