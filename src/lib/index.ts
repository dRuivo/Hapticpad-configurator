// place files you want to import through the `$lib` alias in this folder.

export { default as MacropadSvg } from './components/MacropadSvg.svelte';
export { default as KeyConfigPanel } from './components/KeyConfigPanel.svelte';
export { default as ProfilesSidebar } from './components/ProfilesSidebar.svelte';
export type { SelectedTarget, Profile, KeyConfig, AppState } from './model/types.js';
export { isWheelSelected, isKeySelected, createEmptyProfile, generateId } from './model/types.js';
export { importConfigZip, exportConfigZip, exportConfigXml, downloadBlob } from './io/configZip.js';
export { parseConfigXml, buildConfigXml } from './io/xmlCodec.js';
