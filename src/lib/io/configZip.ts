import JSZip from 'jszip';
import type { AppState } from '$lib/model/types';
import { parseConfigXml, buildConfigXml } from './xmlCodec';

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
 * Import configuration from ZIP file
 */
export async function importConfigZip(file: File): Promise<ImportResult> {
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

		if (!configEntry) {
			throw new Error('config.xml not found in ZIP file');
		}

		if (configEntry.dir) {
			throw new Error('config.xml is a directory, not a file');
		}

		const configXml = await configEntry.async('text');

		// Parse XML configuration
		const { profiles, settingsXml, warnings: parseWarnings } = parseConfigXml(configXml);
		warnings.push(...parseWarnings);

		// Load BMP files for each profile
		for (const profile of profiles) {
			let missingBmps = 0;

			for (let keyIndex = 0; keyIndex < 6; keyIndex++) {
				const bmpPath = `${pathPrefix}${profile.name}/${keyIndex + 1}.bmp`;
				const bmpEntry = zipData.files[bmpPath];

				if (bmpEntry && !bmpEntry.dir) {
					try {
						const bmpData = await bmpEntry.async('uint8array');
						profile.keys[keyIndex].bmp = bmpData;
					} catch (error) {
						warnings.push(
							`Failed to load ${bmpPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
						missingBmps++;
					}
				} else {
					missingBmps++;
				}
			}

			if (missingBmps > 0) {
				warnings.push(`Profile "${profile.name}" missing ${missingBmps} BMP file(s)`);
			}
		}

		// Create app state
		const state: AppState = {
			profiles,
			selectedProfileId: profiles[0]?.id || '',
			selectedTarget: { kind: 'key', index: 0 },
			settingsXml
		};

		return { state, warnings };
	} catch (error) {
		throw new Error(
			`Failed to import ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Export configuration as ZIP file
 */
export async function exportConfigZip(state: AppState): Promise<ExportResult> {
	const warnings: string[] = [];

	try {
		const zip = new JSZip();

		// Generate and add config.xml
		const { xmlText, warnings: xmlWarnings } = buildConfigXml(state);
		warnings.push(...xmlWarnings);
		zip.file('config.xml', xmlText);

		// Add BMP files for each profile
		for (const profile of state.profiles) {
			const profileFolder = zip.folder(profile.name);
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
						warnings.push(
							`Failed to add BMP for key ${keyIndex + 1} in profile "${profile.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
						);
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
