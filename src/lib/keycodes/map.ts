/**
 * Mapping of numeric keycodes to human-readable names
 * Source: https://keycode-visualizer.netlify.app/
 */

export interface KeycodeInfo {
	name: string;
	description?: string;
}

export const KEYCODE_MAP: Record<number, KeycodeInfo> = {
	0: { name: 'None' },
	8: { name: 'Backspace' },
	9: { name: 'Tab' },
	13: { name: 'Enter' },
	16: { name: 'Shift' },
	17: { name: 'Ctrl' },
	18: { name: 'Alt' },
	19: { name: 'Pause' },
	20: { name: 'Caps Lock' },
	27: { name: 'Escape' },
	32: { name: 'Space' },
	33: { name: 'Page Up' },
	34: { name: 'Page Down' },
	35: { name: 'End' },
	36: { name: 'Home' },
	37: { name: 'Left Arrow' },
	38: { name: 'Up Arrow' },
	39: { name: 'Right Arrow' },
	40: { name: 'Down Arrow' },
	45: { name: 'Insert' },
	46: { name: 'Delete' },
	48: { name: '0' },
	49: { name: '1' },
	50: { name: '2' },
	51: { name: '3' },
	52: { name: '4' },
	53: { name: '5' },
	54: { name: '6' },
	55: { name: '7' },
	56: { name: '8' },
	57: { name: '9' },
	65: { name: 'A' },
	66: { name: 'B' },
	67: { name: 'C' },
	68: { name: 'D' },
	69: { name: 'E' },
	70: { name: 'F' },
	71: { name: 'G' },
	72: { name: 'H' },
	73: { name: 'I' },
	74: { name: 'J' },
	75: { name: 'K' },
	76: { name: 'L' },
	77: { name: 'M' },
	78: { name: 'N' },
	79: { name: 'O' },
	80: { name: 'P' },
	81: { name: 'Q' },
	82: { name: 'R' },
	83: { name: 'S' },
	84: { name: 'T' },
	85: { name: 'U' },
	86: { name: 'V' },
	87: { name: 'W' },
	88: { name: 'X' },
	89: { name: 'Y' },
	90: { name: 'Z' },
	91: { name: 'Left Windows' },
	92: { name: 'Right Windows' },
	93: { name: 'Menu' },
	96: { name: 'Numpad 0' },
	97: { name: 'Numpad 1' },
	98: { name: 'Numpad 2' },
	99: { name: 'Numpad 3' },
	100: { name: 'Numpad 4' },
	101: { name: 'Numpad 5' },
	102: { name: 'Numpad 6' },
	103: { name: 'Numpad 7' },
	104: { name: 'Numpad 8' },
	105: { name: 'Numpad 9' },
	106: { name: 'Numpad *' },
	107: { name: 'Numpad +' },
	109: { name: 'Numpad -' },
	110: { name: 'Numpad .' },
	111: { name: 'Numpad /' },
	112: { name: 'F1' },
	113: { name: 'F2' },
	114: { name: 'F3' },
	115: { name: 'F4' },
	116: { name: 'F5' },
	117: { name: 'F6' },
	118: { name: 'F7' },
	119: { name: 'F8' },
	120: { name: 'F9' },
	121: { name: 'F10' },
	122: { name: 'F11' },
	123: { name: 'F12' },
	131: { name: 'Left Shift' },
	132: { name: 'Right Shift' },
	133: { name: 'Left Ctrl' },
	134: { name: 'Right Ctrl' },
	135: { name: 'Left Alt' },
	136: { name: 'Right Alt' },
	144: { name: 'Num Lock' },
	145: { name: 'Scroll Lock' },
	186: { name: ';' },
	187: { name: '=' },
	188: { name: ',' },
	189: { name: '-' },
	190: { name: '.' },
	191: { name: '/' },
	192: { name: '`' },
	219: { name: '[' },
	220: { name: '\\' },
	221: { name: ']' },
	222: { name: "'" }
};

/**
 * Get human-readable name for a keycode
 */
export function getKeycodeDisplayName(keycode: number): string {
	if (keycode === 0) return '(None)';

	const info = KEYCODE_MAP[keycode];
	if (info) {
		return `(${info.name})`;
	}

	return '(Unknown)';
}

/**
 * Check if a keycode is valid/known
 */
export function isValidKeycode(keycode: number): boolean {
	return keycode === 0 || keycode in KEYCODE_MAP;
}
