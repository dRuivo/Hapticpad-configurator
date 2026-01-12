import type { ActionSlot } from '$lib/model/types';

export interface NormalizedKeyEvent {
	keyCode: number;
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
	meta: boolean;
	name: string;
}

/**
 * Normalize a keyboard event to extract keyCode and modifier state
 */
export function normalizeKeyEvent(event: KeyboardEvent): NormalizedKeyEvent {
	const keyCode = event.keyCode || 0;
	const ctrl = event.ctrlKey || event.metaKey; // macOS uses metaKey for Cmd
	const shift = event.shiftKey;
	const alt = event.altKey;
	const meta = event.metaKey && !event.ctrlKey; // Only set meta if it's not already captured as ctrl

	return {
		keyCode,
		ctrl,
		shift,
		alt,
		meta,
		name: getKeycodeDisplayName(keyCode)
	};
}

/**
 * Get human-readable name for a keycode
 */
export function getKeycodeDisplayName(code: number): string {
	const KEYCODE_NAMES: Record<number, string> = {
		0: 'None',
		8: 'Backspace',
		9: 'Tab',
		13: 'Enter',
		16: 'Shift',
		17: 'Ctrl',
		18: 'Alt',
		19: 'Pause',
		20: 'Caps Lock',
		27: 'Escape',
		32: 'Space',
		33: 'Page Up',
		34: 'Page Down',
		35: 'End',
		36: 'Home',
		37: 'Left Arrow',
		38: 'Up Arrow',
		39: 'Right Arrow',
		40: 'Down Arrow',
		45: 'Insert',
		46: 'Delete',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		65: 'A',
		66: 'B',
		67: 'C',
		68: 'D',
		69: 'E',
		70: 'F',
		71: 'G',
		72: 'H',
		73: 'I',
		74: 'J',
		75: 'K',
		76: 'L',
		77: 'M',
		78: 'N',
		79: 'O',
		80: 'P',
		81: 'Q',
		82: 'R',
		83: 'S',
		84: 'T',
		85: 'U',
		86: 'V',
		87: 'W',
		88: 'X',
		89: 'Y',
		90: 'Z',
		91: 'Left Windows',
		92: 'Right Windows',
		93: 'Context Menu',
		96: 'Numpad 0',
		97: 'Numpad 1',
		98: 'Numpad 2',
		99: 'Numpad 3',
		100: 'Numpad 4',
		101: 'Numpad 5',
		102: 'Numpad 6',
		103: 'Numpad 7',
		104: 'Numpad 8',
		105: 'Numpad 9',
		106: 'Numpad *',
		107: 'Numpad +',
		109: 'Numpad -',
		110: 'Numpad .',
		111: 'Numpad /',
		112: 'F1',
		113: 'F2',
		114: 'F3',
		115: 'F4',
		116: 'F5',
		117: 'F6',
		118: 'F7',
		119: 'F8',
		120: 'F9',
		121: 'F10',
		122: 'F11',
		123: 'F12',
		144: 'Num Lock',
		145: 'Scroll Lock',
		186: ';',
		187: '=',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		192: '`',
		219: '[',
		220: '\\',
		221: ']',
		222: "'"
	};

	return KEYCODE_NAMES[code] || 'Unknown';
}

/**
 * Build chord actions from a keyboard event
 * Returns up to 3 action slots filled with modifier and main key keycodes
 */
export function buildChordActions(event: KeyboardEvent): {
	actions: [ActionSlot | null, ActionSlot | null, ActionSlot | null];
	warning?: string;
} {
	const normalized = normalizeKeyEvent(event);
	const actions: [ActionSlot | null, ActionSlot | null, ActionSlot | null] = [null, null, null];

	// Collect modifier keycodes in order: Ctrl, Shift, Alt, Meta
	const modifiers: number[] = [];
	if (normalized.ctrl) modifiers.push(17); // Ctrl
	if (normalized.shift) modifiers.push(16); // Shift
	if (normalized.alt) modifiers.push(18); // Alt
	if (normalized.meta) modifiers.push(91); // Left Windows/Meta

	// Check if this is a modifier key itself - if so, don't add it twice
	const isModifierKey = [16, 17, 18, 91, 92, 93].includes(normalized.keyCode);

	let slotIndex = 0;

	// Add modifiers (up to 2)
	for (let i = 0; i < Math.min(modifiers.length, 2); i++) {
		actions[slotIndex] = { delayMs: 0, keycode: modifiers[i] };
		slotIndex++;
	}

	// Add main key if it's not a modifier
	if (!isModifierKey && normalized.keyCode > 0) {
		actions[slotIndex] = { delayMs: 0, keycode: normalized.keyCode };
		slotIndex++;
	}

	// Warn if too many modifiers
	let warning: string | undefined;
	if (modifiers.length > 2) {
		warning = `Only up to 3 simultaneous keys supported. Capturing first 2 modifiers and main key.`;
	}

	return { actions, warning };
}

/**
 * Check if a keyboard event represents a valid key press to capture
 */
export function isValidCaptureKey(event: KeyboardEvent): boolean {
	// Ignore pure modifier keys being pressed alone
	if (
		[16, 17, 18, 91, 92, 93].includes(event.keyCode) &&
		!event.ctrlKey &&
		!event.shiftKey &&
		!event.altKey &&
		!event.metaKey
	) {
		return false;
	}

	// Ignore Escape (reserved for cancel)
	if (event.keyCode === 27) {
		return false;
	}

	return event.keyCode > 0;
}
