export type SelectedTarget = { kind: 'wheel' } | { kind: 'key'; index: number };

export function isWheelSelected(target: SelectedTarget): target is { kind: 'wheel' } {
	return target.kind === 'wheel';
}

export function isKeySelected(target: SelectedTarget): target is { kind: 'key'; index: number } {
	return target.kind === 'key';
}

export interface KeyConfig {
	label: string;
	icon?: string;
}

export interface Profile {
	id: string;
	name: string;
	keys: KeyConfig[];
}

export interface AppState {
	profiles: Profile[];
	selectedProfileId: string;
	selectedTarget: SelectedTarget;
}

// Utility function to generate unique IDs
export function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for environments without crypto.randomUUID
	return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new empty profile
export function createEmptyProfile(name: string): Profile {
	const defaultIcons = ['⬆', '⬇', '📋', '⌨', '🖱', '⚙'];
	return {
		id: generateId(),
		name,
		keys: Array.from({ length: 6 }, (_, i) => ({
			label: '',
			icon: defaultIcons[i] || '⚙'
		}))
	};
}
