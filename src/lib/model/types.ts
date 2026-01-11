export type SelectedTarget = { kind: 'wheel' } | { kind: 'key'; index: number };

export function isWheelSelected(target: SelectedTarget): target is { kind: 'wheel' } {
	return target.kind === 'wheel';
}

export function isKeySelected(target: SelectedTarget): target is { kind: 'key'; index: number } {
	return target.kind === 'key';
}
