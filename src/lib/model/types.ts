export type SelectedTarget = { kind: 'wheel' } | { kind: 'key'; index: number };

export function isWheelSelected(target: SelectedTarget): target is { kind: 'wheel' } {
	return target.kind === 'wheel';
}

export function isKeySelected(target: SelectedTarget): target is { kind: 'key'; index: number } {
	return target.kind === 'key';
}

export type WheelMode = 'Clicky' | 'Twist' | 'Momentum';

export type ActionSlot = {
	delayMs: number;
	keycode: number;
};

export interface KeyConfig {
	label: string;
	icon?: string;
	bmp?: Blob | Uint8Array | ArrayBuffer | null;
	actions: [ActionSlot | null, ActionSlot | null, ActionSlot | null];
	actionsXml?: string; // Preserved action XML for round-trip
}

export interface Profile {
	id: string;
	name: string;
	wheelMode: WheelMode;
	wheelKey: number;
	keys: KeyConfig[];
	wheelModeXml?: string; // Preserved wheel XML for round-trip
	wheelKeyXml?: string;
}

export interface AppState {
	profiles: Profile[];
	selectedProfileId: string;
	selectedTarget: SelectedTarget;
	settingsXml?: string; // Preserved settings XML for round-trip
	isDirty?: boolean; // Track unsaved changes
}

export interface ImportPreview {
	profileCount: number;
	hasSettings: boolean;
	bitmapSummary: string;
	warnings: string[];
	state: AppState;
}

// Profile name validation
export function hasUnsafeProfileName(name: string): boolean {
	if (!name || !name.trim()) return true;

	// Check for unsafe filesystem characters
	const unsafeChars = /[\/\\:*?"<>|]/;
	if (unsafeChars.test(name)) return true;

	// Check for trailing dots or spaces
	if (name.endsWith('.') || name.endsWith(' ')) return true;

	return false;
}

// Sanitize profile name for filesystem
export function sanitizeProfileName(name: string): string {
	if (!name || !name.trim()) return 'Unnamed';

	// Replace unsafe characters
	let sanitized = name.replace(/[\/\\:*?"<>|]/g, '_');

	// Trim trailing dots and spaces
	sanitized = sanitized.replace(/[.\s]+$/, '');

	// Ensure not empty after sanitization
	if (!sanitized.trim()) return 'Unnamed';

	return sanitized;
}

// Create unique folder names for export
export function createUniqueFolderNames(profileNames: string[]): { [profileId: string]: string } {
	const folderNames: { [profileId: string]: string } = {};
	const usedNames = new Set<string>();

	profileNames.forEach((name, index) => {
		let sanitized = sanitizeProfileName(name);
		let uniqueName = sanitized;
		let counter = 2;

		// Make unique if duplicate
		while (usedNames.has(uniqueName)) {
			uniqueName = `${sanitized} (${counter})`;
			counter++;
		}

		usedNames.add(uniqueName);
		folderNames[`profile-${index}`] = uniqueName;
	});

	return folderNames;
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
		wheelMode: 'Clicky',
		wheelKey: 0,
		keys: Array.from({ length: 6 }, (_, i) => ({
			label: '',
			icon: defaultIcons[i] || '⚙',
			actions: [
				{ delayMs: 0, keycode: 0 },
				{ delayMs: 0, keycode: 0 },
				{ delayMs: 0, keycode: 0 }
			]
		}))
	};
}
