<script lang="ts">
	import type { ImportPreview } from '$lib/model/types';

	export let preview: ImportPreview | null = null;
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};

	$: isOpen = !!preview;

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			onCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && preview}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={handleBackdropClick}>
		<div
			class="modal-content"
			role="dialog"
			aria-labelledby="import-preview-title"
			aria-modal="true"
		>
			<h2 id="import-preview-title">Import Preview</h2>

			<div class="preview-details">
				<div class="detail-row">
					<span class="label">Profiles:</span>
					<span class="value">{preview.profileCount}</span>
				</div>

				<div class="detail-row">
					<span class="label">Settings:</span>
					<span class="value">{preview.hasSettings ? 'Included' : 'None'}</span>
				</div>

				<div class="detail-row">
					<span class="label">Bitmaps:</span>
					<span class="value">{preview.bitmapSummary}</span>
				</div>
			</div>

			{#if preview.warnings.length > 0}
				<div class="warnings-section">
					<h3>Warnings</h3>
					<ul class="warnings-list">
						{#each preview.warnings as warning}
							<li>{warning}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="profile-list">
				<h3>Profiles to import</h3>
				<ul class="profiles">
					{#each preview.state.profiles as profile}
						{@const bitmapCount = profile.keys.filter((k) => k.bmp).length}
						<li class="profile-item">
							<span class="profile-name">{profile.name}</span>
							<span class="bitmap-indicator" class:has-bitmaps={bitmapCount > 0}>
								{bitmapCount}/6 icons
							</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn btn-secondary" on:click={onCancel}> Cancel </button>
				<button type="button" class="btn btn-primary" on:click={onConfirm}>
					Import {preview.profileCount} profile{preview.profileCount !== 1 ? 's' : ''}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
		padding: 24px;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	}

	h2 {
		margin: 0 0 20px 0;
		font-size: 1.5rem;
		color: #333;
	}

	h3 {
		margin: 20px 0 12px 0;
		font-size: 1.1rem;
		color: #555;
	}

	.preview-details {
		margin-bottom: 20px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.label {
		font-weight: 600;
		color: #555;
	}

	.value {
		color: #333;
	}

	.warnings-section {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
		padding: 12px;
		margin-bottom: 20px;
	}

	.warnings-section h3 {
		margin: 0 0 8px 0;
		color: #856404;
	}

	.warnings-list {
		margin: 0;
		padding-left: 16px;
		color: #856404;
	}

	.warnings-list li {
		margin-bottom: 4px;
	}

	.profile-list {
		margin-bottom: 24px;
	}

	.profiles {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.profile-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #eee;
	}

	.profile-item:last-child {
		border-bottom: none;
	}

	.profile-name {
		font-weight: 500;
		color: #333;
	}

	.bitmap-indicator {
		font-size: 0.85rem;
		color: #999;
		padding: 2px 6px;
		border-radius: 4px;
		background: #f5f5f5;
	}

	.bitmap-indicator.has-bitmaps {
		background: #e8f5e8;
		color: #2d5a3d;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 24px;
	}

	.btn {
		padding: 8px 16px;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}

	.btn-secondary {
		background: white;
		color: #666;
		border-color: #ddd;
	}

	.btn-secondary:hover {
		background: #f8f9fa;
		border-color: #adb5bd;
	}

	.btn-primary {
		background: #0066cc;
		color: white;
		border-color: #0066cc;
	}

	.btn-primary:hover {
		background: #0052a3;
		border-color: #0052a3;
	}
</style>
