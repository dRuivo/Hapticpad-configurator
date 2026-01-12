# Hapticpad Configurator (Prototype)

A browser-based configurator for **CNCDan’s Hapticpad** — allowing you to import, edit, and export Hapticpad configurations without flashing firmware or editing XML by hand.

This project is a **prototype** focused on usability, clarity, and safe round-tripping of existing configurations.

---

## What this is

- A **web UI** to configure Hapticpad profiles
- Works entirely **client-side** (no backend)
- Lets you:
  - Import existing Hapticpad configurations
  - Edit profiles, keys, wheel behavior, labels, and actions
  - Preview icons and labels as they appear on the device
  - Export valid configuration bundles again

Built to respect the structure and constraints of the original Hapticpad firmware.

---

## Supported features

### Profiles

- Add, remove, rename, reorder, and duplicate profiles
- Up to **128 profiles** (Hapticpad limit)
- Profile names map to export folder names (with safety checks)

### Macro buttons

- 6 macro buttons per profile
- Each button supports **3 action slots**
  - Each action is `delayMs,keycode`
  - Fully compatible with Hapticpad firmware
- Human-readable key names shown in UI (numeric keycodes are the source of truth)

### Wheel

- Selectable and configurable
- Wheel modes:
  - `Clicky`
  - `Twist`
  - `Momentum`
- Wheel key capture (single keycode, held during rotation)

### Key capture

- Capture key presses directly from the keyboard
- Supports **chords** (Ctrl / Shift / Alt / Meta + key)
- Chords map automatically to the 3 action slots
- Numeric keycodes stored exactly as required by Hapticpad

### Icons

- Imports existing `1.bmp … 6.bmp` files per profile
- Renders icons in the device display preview
- Icons are preserved and re-exported unchanged
- Missing icons are handled gracefully

### Import / Export

- Import:
  - ZIP bundles (`config.xml` + profile folders)
  - XML-only (`config.xml`)
- Export:
  - Full ZIP bundle
  - XML-only
- OS metadata is ignored safely (macOS, Windows, Linux)
- Unknown XML nodes are preserved where possible

### Safety & UX

- Import preview + confirmation
- Unsaved changes indicator (session-only)
- Warnings for missing icons, invalid data, unsafe profile names
- Onboarding modal explaining how everything works

---

## Expected configuration structure

ZIP imports/exports follow this structure:

```
config.xml
Profile Name 1/
  1.bmp
  2.bmp
  3.bmp
  4.bmp
  5.bmp
  6.bmp
Profile Name 2/
  1.bmp
  ...
```

- Button icons are **1-based**
- Profile folder names correspond to profile names
- Extra OS metadata files are ignored automatically

---

## Keycode model

- The configurator uses **numeric keycodes** as defined by  
  https://keycode-visualizer.netlify.app
- Human-readable key names are shown in the UI for convenience
- Only numeric values are written to XML (no derived data)

---

## Project status

This is a **prototype**.

Things it intentionally does **not** do (yet):

- Persist state between sessions
- Edit or draw bitmap icons (upload/assign is planned)
- Validate configs against every possible firmware edge case

The goal is to make configuration **pleasant and safe**, not to replace the firmware.

---

## Credits

- **Hapticpad firmware & hardware**  
  CNCDan / dmcke5  
  https://github.com/dmcke5/Hapticpad

This configurator is built to complement and respect the original project.

---

## Support

If this tool is useful to you, consider buying me a coffee:

https://buymeacoffee.com/wayfindingdiogo

---

## Development

```bash
pnpm install
pnpm run dev
```

The project is built with:

- SvelteKit
- TypeScript
- SVG + Canvas (client-side only)

---

## License

This project is provided as-is.  
Refer to the Hapticpad repository for firmware licensing details.
