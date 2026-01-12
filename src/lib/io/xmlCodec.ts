import type { Profile, AppState, KeyConfig } from '$lib/model/types';
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

				// Preserve wheel configuration XML
				let wheelModeXml: string | undefined;
				let wheelKeyXml: string | undefined;
				const wheelModeNode = profileNode.querySelector('WheelMode');
				const wheelKeyNode = profileNode.querySelector('WheelKey');
				if (wheelModeNode) {
					wheelModeXml = new XMLSerializer().serializeToString(wheelModeNode);
				}
				if (wheelKeyNode) {
					wheelKeyXml = new XMLSerializer().serializeToString(wheelKeyNode);
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

						if (buttonNode) {
							const labelNode = buttonNode.querySelector('Label');
							if (labelNode) {
								label = labelNode.textContent || '';
							}

							// Preserve actions XML
							const actionNodes = buttonNode.querySelectorAll('Action');
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
							actionsXml: actionsXml || undefined
						});
					}
				} else {
					// No MacroButtons found, create empty keys
					for (let j = 0; j < 6; j++) {
						keys.push({
							label: '',
							icon: getDefaultIcon(j),
							bmp: null
						});
					}
					warnings.push(`Profile "${name}" has no MacroButtons section`);
				}

				profiles.push({
					id: generateId(),
					name,
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
				keys: Array.from({ length: 6 }, (_, i) => ({
					label: '',
					icon: getDefaultIcon(i),
					bmp: null
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

			// Add wheel configuration if preserved
			if (profile.wheelModeXml) {
				try {
					const parser = new DOMParser();
					const wheelDoc = parser.parseFromString(profile.wheelModeXml, 'application/xml');
					const wheelNode = wheelDoc.documentElement;
					if (wheelNode) {
						profileElement.appendChild(doc.importNode(wheelNode, true));
					}
				} catch (error) {
					warnings.push(`Failed to restore wheel mode XML for profile "${profile.name}"`);
				}
			}

			if (profile.wheelKeyXml) {
				try {
					const parser = new DOMParser();
					const wheelDoc = parser.parseFromString(profile.wheelKeyXml, 'application/xml');
					const wheelNode = wheelDoc.documentElement;
					if (wheelNode) {
						profileElement.appendChild(doc.importNode(wheelNode, true));
					}
				} catch (error) {
					warnings.push(`Failed to restore wheel key XML for profile "${profile.name}"`);
				}
			}

			// Add default wheel configuration if none preserved
			if (!profile.wheelModeXml) {
				const wheelMode = doc.createElement('WheelMode');
				wheelMode.textContent = 'Clicky';
				profileElement.appendChild(wheelMode);
			}

			if (!profile.wheelKeyXml) {
				const wheelKey = doc.createElement('WheelKey');
				wheelKey.textContent = '0';
				profileElement.appendChild(wheelKey);
			}

			// Add MacroButtons
			const macroButtonsElement = doc.createElement('MacroButtons');
			profileElement.appendChild(macroButtonsElement);

			profile.keys.forEach((key, index) => {
				const buttonElement = doc.createElement('MacroButton');

				// Add actions (preserved or default)
				if (key.actionsXml) {
					try {
						const parser = new DOMParser();
						const actionsDoc = parser.parseFromString(key.actionsXml, 'application/xml');
						const actionsNode = actionsDoc.documentElement;
						if (actionsNode) {
							const actionNodes = actionsNode.querySelectorAll('Action');
							actionNodes.forEach((action) => {
								buttonElement.appendChild(doc.importNode(action, true));
							});
						}
					} catch (error) {
						warnings.push(
							`Failed to restore actions for key ${index + 1} in profile "${profile.name}"`
						);
						addDefaultActions(doc, buttonElement, index);
					}
				} else {
					addDefaultActions(doc, buttonElement, index);
				}

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

function addDefaultActions(doc: Document, buttonElement: Element, keyIndex: number): void {
	// Add default actions based on example pattern
	const actions = [
		`0,${49 + keyIndex}`, // Key codes 49-54 for keys 1-6
		'0,0',
		'0,0'
	];

	actions.forEach((actionValue) => {
		const action = doc.createElement('Action');
		action.textContent = actionValue;
		buttonElement.appendChild(action);
	});
}

function getDefaultIcon(index: number): string {
	const defaultIcons = ['⬆', '⬇', '📋', '⌨', '🖱', '⚙'];
	return defaultIcons[index] || '⚙';
}
