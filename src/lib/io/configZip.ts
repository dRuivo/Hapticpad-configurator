import JSZip from 'jszip';
import type { AppState, ImportPreview } from '$lib/model/types';
import { parseConfigXml, buildConfigXml } from './xmlCodec';
import { createUniqueFolderNames, sanitizeProfileName } from '$lib/model/types';

interface ImportResult {
	state: AppState;
	warnings: string[];
}

interface ExportResult {
	blob: Blob;
	warnings: string[];
}

/**
 * Check if a path should be ignored as OS metadata
 */
function isMetadataPath(path: string): boolean {
	const segments = path.split('/');

	// Ignore if any segment starts with '.'
	if (segments.some((segment) => segment.startsWith('.'))) {
		return true;
	}

	// Ignore __MACOSX folder
	if (path.includes('__MACOSX/')) {
		return true;
	}

	// Ignore common metadata files
	const filename = segments[segments.length - 1];
	const metadataFiles = ['.DS_Store', 'Thumbs.db', 'Desktop.ini'];
	if (metadataFiles.includes(filename)) {
		return true;
	}

	// Ignore AppleDouble/resource fork files
	if (filename.startsWith('._')) {
		return true;
	}

	return false;
}

/**
 * Validate if a path is an expected config file
 */
function isValidConfigPath(path: string): boolean {
	// Allow config.xml at root
	if (path === 'config.xml') {
		return true;
	}

	// Allow *.bmp files in profile folders
	const segments = path.split('/');
	if (segments.length === 2) {
		const [folder, filename] = segments;
		if (filename.match(/^[1-6]\.bmp$/)) {
			return true;
		}
	}

	return false;
}

/**
 * Import configuration from XML file only
 */
export async function importConfigXmlOnly(file: File): Promise<ImportPreview> {
	const warnings: string[] = [];

	try {
		// Read XML file content
		const xmlText = await file.text();

		// Parse XML configuration
		const { profiles, settingsXml, warnings: parseWarnings } = parseConfigXml(xmlText);
		warnings.push(...parseWarnings);

		// Add warning about missing bitmaps
		warnings.push('No bitmap files imported (XML-only import)');

		// Ensure all keys have null bmp payloads
		for (const profile of profiles) {
			for (const key of profile.keys) {
				key.bmp = null;
			}
		}

		// Create app state
		const state: AppState = {
			profiles,
			selectedProfileId: profiles[0]?.id || '',
			selectedTarget: { kind: 'key', index: 0 },
			settingsXml
		};

		// Create preview
		const preview: ImportPreview = {
			profileCount: profiles.length,
			hasSettings: !!settingsXml,
			bitmapSummary: 'none (XML-only)',
			warnings,
			state
		};

		return preview;
	} catch (error) {
		throw new Error(
			`Failed to import XML: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Create import preview from ZIP file without committing changes
 */
export async function createZipImportPreview(file: File): Promise<ImportPreview> {
	const warnings: string[] = [];

	try {
		// Load ZIP file
		const zip = new JSZip();
		const zipData = await zip.loadAsync(file);

		// Filter out metadata and find valid paths
		const allEntries = Object.keys(zipData.files);
		const validEntries = allEntries.filter((path) => !isMetadataPath(path));

		if (validEntries.length === 0) {
			throw new Error('ZIP file contains no valid configuration files');
		}

		// Find config.xml - it might be at root or in a subfolder
		let configEntry = zipData.files['config.xml'];
		let pathPrefix = '';

		if (!configEntry) {
			// Look for config.xml in subfolders
			const configPaths = validEntries.filter(
				(path) => path.endsWith('/config.xml') || path === 'config.xml'
			);
			if (configPaths.length > 0) {
				const configPath = configPaths[0];
				configEntry = zipData.files[configPath];
				// Extract path prefix if config.xml is in a subfolder
				if (configPath !== 'config.xml') {
					pathPrefix = configPath.replace('/config.xml', '') + '/';
				}
			}
		}

		if (!configEntry || configEntry.dir) {
			throw new Error('config.xml not found or is invalid in ZIP file');
		}

		const configXml = await configEntry.async('text');

		// Parse XML configuration
		const { profiles, settingsXml, warnings: parseWarnings } = parseConfigXml(configXml);
		warnings.push(...parseWarnings);

		// Count available BMP files
		let totalBmps = 0;
		let foundBmps = 0;

		for (const profile of profiles) {
			for (let keyIndex = 0; keyIndex < 6; keyIndex++) {
				totalBmps++;
				const bmpPath = `${pathPrefix}${profile.name}/${keyIndex + 1}.bmp`;
				const bmpEntry = zipData.files[bmpPath];

				if (bmpEntry && !bmpEntry.dir) {
					foundBmps++;
					try {
						const bmpData = await bmpEntry.async('uint8array');
						profile.keys[keyIndex].bmp = bmpData;
					} catch (error) {
						warnings.push(`Failed to load ${bmpPath}`);
						foundBmps--;
					}
				} else {
					profile.keys[keyIndex].bmp = null;
				}
			}
		}

		// Create app state
		const state: AppState = {
			profiles,
			selectedProfileId: profiles[0]?.id || '',
			selectedTarget: { kind: 'key', index: 0 },
			settingsXml
		};

		// Create preview
		const bitmapSummary = totalBmps > 0 ? `${foundBmps}/${totalBmps} BMPs` : 'none';
		const preview: ImportPreview = {
			profileCount: profiles.length,
			hasSettings: !!settingsXml,
			bitmapSummary,
			warnings,
			state
		};

		return preview;
	} catch (error) {
		throw new Error(
			`Failed to create import preview: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Import configuration from ZIP file (deprecated - use createZipImportPreview instead)
 */
export async function importConfigZip(file: File): Promise<ImportResult> {
	const preview = await createZipImportPreview(file);
	return { state: preview.state, warnings: preview.warnings };
}

/**
 * Export configuration as ZIP file with safe folder names
 */
export async function exportConfigZip(state: AppState): Promise<ExportResult> {
	const warnings: string[] = [];

	try {
		const zip = new JSZip();

		// Generate and add config.xml
		const { xmlText, warnings: xmlWarnings } = buildConfigXml(state);
		warnings.push(...xmlWarnings);
		zip.file('config.xml', xmlText);

		// Create safe, unique folder names
		const profileNames = state.profiles.map((p) => p.name);
		const folderNames = createUniqueFolderNames(profileNames);

		// Check if any names were sanitized or duplicated
		let namesSanitized = false;
		let namesDuplicated = false;

		state.profiles.forEach((profile, index) => {
			const originalName = profile.name;
			const folderName = folderNames[`profile-${index}`];

			if (sanitizeProfileName(originalName) !== originalName) {
				namesSanitized = true;
			}

			if (folderName !== sanitizeProfileName(originalName)) {
				namesDuplicated = true;
			}
		});

		if (namesSanitized) {
			warnings.push('Profile folder names were sanitized for export');
		}

		if (namesDuplicated) {
			warnings.push('Duplicate profile names detected; folders were disambiguated');
		}

		// Add BMP files for each profile using safe folder names
		for (let i = 0; i < state.profiles.length; i++) {
			const profile = state.profiles[i];
			const folderName = folderNames[`profile-${i}`];

			const profileFolder = zip.folder(folderName);
			if (!profileFolder) {
				warnings.push(`Failed to create folder for profile "${profile.name}"`);
				continue;
			}

			let missingBmps = 0;

			for (let keyIndex = 0; keyIndex < 6; keyIndex++) {
				const key = profile.keys[keyIndex];

				if (key.bmp) {
					try {
						let bmpData: Uint8Array;

						if (key.bmp instanceof Uint8Array) {
							bmpData = key.bmp;
						} else if (key.bmp instanceof ArrayBuffer) {
							bmpData = new Uint8Array(key.bmp);
						} else if (key.bmp instanceof Blob) {
							const arrayBuffer = await key.bmp.arrayBuffer();
							bmpData = new Uint8Array(arrayBuffer);
						} else {
							throw new Error('Unsupported BMP data type');
						}

						profileFolder.file(`${keyIndex + 1}.bmp`, bmpData);
					} catch (error) {
						warnings.push(`Failed to add BMP for key ${keyIndex + 1} in profile "${profile.name}"`);
						missingBmps++;
					}
				} else {
					missingBmps++;
				}
			}

			if (missingBmps > 0) {
				warnings.push(
					`Profile "${profile.name}" missing ${missingBmps} BMP file(s); exported without them`
				);
			}
		}

		// Generate ZIP blob
		const zipBlob = await zip.generateAsync({ type: 'blob' });

		return { blob: zipBlob, warnings };
	} catch (error) {
		throw new Error(
			`Failed to export ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Export configuration as XML file only
 */
export async function exportConfigXml(state: AppState): Promise<ExportResult> {
	try {
		const { xmlText, warnings } = buildConfigXml(state);
		const blob = new Blob([xmlText], { type: 'application/xml' });

		return { blob, warnings };
	} catch (error) {
		throw new Error(
			`Failed to export XML: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
