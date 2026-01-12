<script lang="ts">
	export let isOpen: boolean = false;
	export let title: string = 'Confirm Action';
	export let message: string = 'Are you sure you want to proceed?';
	export let confirmText: string = 'Confirm';
	export let cancelText: string = 'Cancel';
	export let variant: 'danger' | 'warning' = 'danger';
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};

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

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={handleBackdropClick}>
		<div class="modal-content" role="dialog" aria-labelledby="confirm-title" aria-modal="true">
			<div class="modal-header">
				<div class="icon {variant}">
					{#if variant === 'danger'}
						⚠️
					{:else}
						⚠️
					{/if}
				</div>
				<h2 id="confirm-title">{title}</h2>
			</div>

			<div class="modal-body">
				<p>{message}</p>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn btn-secondary" on:click={onCancel}>
					{cancelText}
				</button>
				<button type="button" class="btn btn-{variant}" on:click={onConfirm}>
					{confirmText}
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
		max-width: 400px;
		width: 90%;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.icon {
		font-size: 1.5rem;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.icon.danger {
		background: #fee;
		color: #d32f2f;
	}

	.icon.warning {
		background: #fff3cd;
		color: #856404;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #333;
	}

	.modal-body {
		margin-bottom: 24px;
	}

	.modal-body p {
		margin: 0;
		color: #555;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
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

	.btn-danger {
		background: #d32f2f;
		color: white;
		border-color: #d32f2f;
	}

	.btn-danger:hover {
		background: #b71c1c;
		border-color: #b71c1c;
	}

	.btn-warning {
		background: #f57c00;
		color: white;
		border-color: #f57c00;
	}

	.btn-warning:hover {
		background: #ef6c00;
		border-color: #ef6c00;
	}
</style>
