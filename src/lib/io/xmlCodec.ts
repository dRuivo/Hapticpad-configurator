import type { Profile, AppState, KeyConfig, WheelMode, ActionSlot } from '$lib/model/types';
import { generateId } from '$lib/model/types';

interface ParseResult {
	profiles: Profile[];
	settingsXml?: string;
	warnings: string[];
}

interface BuildResult {
	xmlText: string;
	warnings: string[];
}

/**
 * Parse config.xml string into profiles and preserved settings
 */
export function parseConfigXml(xmlText: string): ParseResult {
	const warnings: string[] = [];
	const profiles: Profile[] = [];

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(xmlText, 'application/xml');

		// Check for parser errors
		const parserError = doc.querySelector('parsererror');
		if (parserError) {
			throw new Error('XML parsing error: ' + parserError.textContent);
		}

		const configNode = doc.querySelector('Configuration');
		if (!configNode) {
			throw new Error('Missing <Configuration> root element');
		}

		// Preserve Settings XML
		let settingsXml: string | undefined;
		const settingsNode = configNode.querySelector('Settings');
		if (settingsNode) {
			settingsXml = new XMLSerializer().serializeToString(settingsNode);
		}

		// Parse Profiles
		const profilesNode = configNode.querySelector('Profiles');
		if (!profilesNode) {
			warnings.push('No <Profiles> section found');
		} else {
			const profileNodes = profilesNode.querySelectorAll('Profile');

			for (let i = 0; i < profileNodes.length; i++) {
				const profileNode = profileNodes[i];
				const name = profileNode.getAttribute('name');

				if (!name) {
					warnings.push(`Profile ${i + 1} missing name attribute, skipping`);
					continue;
				}

				// Parse wheel configuration
				let wheelMode: WheelMode = 'Clicky';
				let wheelKey = 0;
				let wheelModeXml: string | undefined;
				let wheelKeyXml: string | undefined;

				const wheelModeNode = profileNode.querySelector('WheelMode');
				const wheelKeyNode = profileNode.querySelector('WheelKey');

				if (wheelModeNode) {
					wheelModeXml = new XMLSerializer().serializeToString(wheelModeNode);
					const modeText = wheelModeNode.textContent?.trim();
					if (modeText === 'Clicky' || modeText === 'Twist' || modeText === 'Momentum') {
						wheelMode = modeText;
					} else {
						warnings.push(
							`Profile "${name}" has invalid WheelMode "${modeText}", defaulting to Clicky`
						);
					}
				} else {
					warnings.push(`Profile "${name}" missing WheelMode, defaulting to Clicky`);
				}

				if (wheelKeyNode) {
					wheelKeyXml = new XMLSerializer().serializeToString(wheelKeyNode);
					const keyText = wheelKeyNode.textContent?.trim();
					if (keyText) {
						const parsed = parseInt(keyText, 10);
						if (!isNaN(parsed) && parsed >= 0) {
							wheelKey = parsed;
						} else {
							warnings.push(`Profile "${name}" has invalid WheelKey "${keyText}", defaulting to 0`);
						}
					}
				} else {
					warnings.push(`Profile "${name}" missing WheelKey, defaulting to 0`);
				}

				// Parse MacroButtons
				const keys: KeyConfig[] = [];
				const macroButtonsNode = profileNode.querySelector('MacroButtons');

				if (macroButtonsNode) {
					const buttonNodes = macroButtonsNode.querySelectorAll('MacroButton');

					for (let j = 0; j < 6; j++) {
						const buttonNode = buttonNodes[j];
						let label = '';
						let actionsXml = '';
						const actions: [ActionSlot, ActionSlot, ActionSlot] = [
							{ delayMs: 0, keycode: 0 },
							{ delayMs: 0, keycode: 0 },
							{ delayMs: 0, keycode: 0 }
						];

						if (buttonNode) {
							const labelNode = buttonNode.querySelector('Label');
							if (labelNode) {
								label = labelNode.textContent || '';
							}

							// Parse action slots
							const actionNodes = buttonNode.querySelectorAll('Action');
							for (let k = 0; k < Math.min(3, actionNodes.length); k++) {
								const actionText = actionNodes[k].textContent?.trim();
								if (actionText) {
									const parts = actionText.split(',');
									if (parts.length === 2) {
										const delayMs = parseInt(parts[0], 10);
										const keycode = parseInt(parts[1], 10);
										if (!isNaN(delayMs) && !isNaN(keycode) && delayMs >= 0 && keycode >= 0) {
											actions[k] = { delayMs, keycode };
										} else {
											warnings.push(
												`Profile "${name}" button ${j + 1} action ${k + 1} has invalid format "${actionText}"`
											);
										}
									} else {
										warnings.push(
											`Profile "${name}" button ${j + 1} action ${k + 1} has invalid format "${actionText}"`
										);
									}
								}
							}

							// Warn if missing actions
							if (actionNodes.length < 3) {
								warnings.push(
									`Profile "${name}" button ${j + 1} has only ${actionNodes.length} actions, expected 3`
								);
							}

							// Preserve actions XML
							if (actionNodes.length > 0) {
								const actionsContainer = document.createElement('Actions');
								actionNodes.forEach((action) => {
									actionsContainer.appendChild(action.cloneNode(true));
								});
								actionsXml = new XMLSerializer().serializeToString(actionsContainer);
							}
						}

						keys.push({
							label,
							icon: getDefaultIcon(j),
							bmp: null,
							actions,
							actionsXml: actionsXml || undefined
						});
					}
				} else {
					// No MacroButtons found, create empty keys
					for (let j = 0; j < 6; j++) {
						keys.push({
							label: '',
							icon: getDefaultIcon(j),
							bmp: null,
							actions: [
								{ delayMs: 0, keycode: 0 },
								{ delayMs: 0, keycode: 0 },
								{ delayMs: 0, keycode: 0 }
							]
						});
					}
					warnings.push(`Profile "${name}" has no MacroButtons section`);
				}

				profiles.push({
					id: generateId(),
					name,
					wheelMode,
					wheelKey,
					keys,
					wheelModeXml,
					wheelKeyXml
				});
			}
		}

		if (profiles.length === 0) {
			warnings.push('No profiles found, creating default profile');
			profiles.push({
				id: generateId(),
				name: 'Profile 1',
				wheelMode: 'Clicky',
				wheelKey: 0,
				keys: Array.from({ length: 6 }, (_, i) => ({
					label: '',
					icon: getDefaultIcon(i),
					bmp: null,
					actions: [
						{ delayMs: 0, keycode: 0 },
						{ delayMs: 0, keycode: 0 },
						{ delayMs: 0, keycode: 0 }
					]
				}))
			});
		}

		return { profiles, settingsXml, warnings };
	} catch (error) {
		throw new Error(
			`Failed to parse config.xml: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Build config.xml from current app state
 */
export function buildConfigXml(state: AppState): BuildResult {
	const warnings: string[] = [];

	try {
		const doc = document.implementation.createDocument(null, 'Configuration', null);
		const root = doc.documentElement;

		// Add Settings
		if (state.settingsXml) {
			try {
				const parser = new DOMParser();
				const settingsDoc = parser.parseFromString(state.settingsXml, 'application/xml');
				const settingsNode = settingsDoc.documentElement;
				if (settingsNode) {
					root.appendChild(doc.importNode(settingsNode, true));
				}
			} catch (error) {
				warnings.push('Failed to restore settings XML, using default');
				addDefaultSettings(doc, root);
			}
		} else {
			addDefaultSettings(doc, root);
		}

		// Add Profiles
		const profilesElement = doc.createElement('Profiles');
		root.appendChild(profilesElement);

		state.profiles.forEach((profile) => {
			const profileElement = doc.createElement('Profile');
			profileElement.setAttribute('name', profile.name);

			// Add wheel configuration
			const wheelMode = doc.createElement('WheelMode');
			wheelMode.textContent = profile.wheelMode;
			profileElement.appendChild(wheelMode);

			const wheelKey = doc.createElement('WheelKey');
			wheelKey.textContent = profile.wheelKey.toString();
			profileElement.appendChild(wheelKey);

			// Add MacroButtons
			const macroButtonsElement = doc.createElement('MacroButtons');
			profileElement.appendChild(macroButtonsElement);

			profile.keys.forEach((key, index) => {
				const buttonElement = doc.createElement('MacroButton');

				// Add actions (skip null actions)
				key.actions.forEach((action) => {
					if (action !== null) {
						const actionElement = doc.createElement('Action');
						actionElement.textContent = `${action.delayMs},${action.keycode}`;
						buttonElement.appendChild(actionElement);
					}
				});

				// Add Label
				const labelElement = doc.createElement('Label');
				labelElement.textContent = key.label || '';
				buttonElement.appendChild(labelElement);

				macroButtonsElement.appendChild(buttonElement);
			});

			profilesElement.appendChild(profileElement);
		});

		// Serialize to string with proper formatting
		const serializer = new XMLSerializer();
		let xmlText = serializer.serializeToString(doc);

		// Add XML declaration and format
		xmlText = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlText;

		return { xmlText, warnings };
	} catch (error) {
		throw new Error(
			`Failed to build config.xml: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

function addDefaultSettings(doc: Document, root: Element): void {
	const settings = doc.createElement('Settings');

	// Add basic settings based on example
	const settingsData = [
		['LED_Mode', 'Bands'],
		['LED_Primary', '255,0,0'],
		['LED_Secondary', '0,0,255'],
		['Clicky_P', '0.5'],
		['Clicky_I', '0'],
		['Twist_P', '0.65'],
		['Twist_I', '0.2'],
		['Momentum_P', '0.3'],
		['Momentum_I', '0']
	];

	settingsData.forEach(([name, value]) => {
		const element = doc.createElement(name);
		element.textContent = value;
		settings.appendChild(element);
	});

	root.appendChild(settings);
}

function getDefaultIcon(index: number): string {
	const defaultIcons = ['⬆', '⬇', '📋', '⌨', '🖱', '⚙'];
	return defaultIcons[index] || '⚙';
}
